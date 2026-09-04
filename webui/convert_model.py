"""
Convert the trained Keras model to TensorFlow.js LayersModel format and export
norm.json.  No tensorflowjs package required — only tensorflow, pandas, numpy.

Requirements (Python 3.10–3.12 recommended):
    pip install tensorflow pandas numpy

Run from the repo root:
    python webui/convert_model.py
"""

import json
import pathlib
import numpy as np
import pandas as pd
import tensorflow as tf

REPO_ROOT = pathlib.Path(__file__).parent.parent
MODEL_H5  = REPO_ROOT / "models" / "100MWOgen_model.h5"
CSV_PATH  = REPO_ROOT / "solver" / "data" / "data.csv"
OUT_MODEL = REPO_ROOT / "webui" / "assets" / "model"
OUT_NORM  = REPO_ROOT / "webui" / "norm.json"

# ── normalization stats ───────────────────────────────────────────────────────
df = pd.read_csv(CSV_PATH)
x  = df[["alpha", "Lambda", "sigma", "Kappa", "Kappa_", "A", "B", "m1", "m2"]].values.astype(np.float64)
y  = df[["E0", "E1", "E2", "E3"]].values.astype(np.float64)

norm = {
    "x_mean": x.mean(axis=0).tolist(),
    "x_std":  x.std(axis=0).tolist(),
    "y_mean": y.mean(axis=0).tolist(),
    "y_std":  y.std(axis=0).tolist(),
}
OUT_NORM.write_text(json.dumps(norm, indent=2))
print(f"Saved {OUT_NORM}")

# ── load Keras model ──────────────────────────────────────────────────────────
model = tf.keras.models.load_model(MODEL_H5)
OUT_MODEL.mkdir(parents=True, exist_ok=True)

# ── build weightsManifest and binary payload ──────────────────────────────────
weights_manifest = []
binary = bytearray()

for layer in model.layers:
    for w in layer.weights:
        arr = w.numpy().astype(np.float32)
        # strip trailing ":0" that TF appends to weight names
        name = w.name.removesuffix(":0")
        weights_manifest.append({"name": name, "shape": list(arr.shape), "dtype": "float32"})
        binary.extend(arr.tobytes())

# ── write group1-shard1of1.bin ────────────────────────────────────────────────
bin_path = OUT_MODEL / "group1-shard1of1.bin"
bin_path.write_bytes(binary)
print(f"Saved {bin_path}  ({len(binary)} bytes)")

# ── write model.json ──────────────────────────────────────────────────────────
topology = json.loads(model.to_json())
model_json = {
    "format": "layers-model",
    "generatedBy": f"keras v{tf.keras.__version__}",
    "convertedBy": "convert_model.py",
    "modelTopology": topology,
    "weightsManifest": [
        {"paths": ["group1-shard1of1.bin"], "weights": weights_manifest}
    ],
}
(OUT_MODEL / "model.json").write_text(json.dumps(model_json))
print(f"Saved {OUT_MODEL / 'model.json'}")
