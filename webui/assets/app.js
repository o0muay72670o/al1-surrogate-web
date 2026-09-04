'use strict';

// weights layout: [kernel(9×64), bias(64), kernel(64×64), bias(64), kernel(64×64), bias(64), kernel(64×4), bias(4)]
const LAYERS = [
  { inSize: 9,  outSize: 64, act: 'silu' },
  { inSize: 64, outSize: 64, act: 'silu' },
  { inSize: 64, outSize: 64, act: 'silu' },
  { inSize: 64, outSize: 4,  act: 'linear' },
];

let weights = null;
let norm    = null;

// Keras stores kernels row-major: kernel[i * outSize + j] = weight(input_i → output_j)
function dense(input, kernel, bias, inSize, outSize) {
  const out = new Float32Array(outSize);
  for (let j = 0; j < outSize; j++) {
    let s = bias[j];
    for (let i = 0; i < inSize; i++) s += input[i] * kernel[i * outSize + j];
    out[j] = s;
  }
  return out;
}

const activations = {
  silu:   arr => arr.map(v => v / (1 + Math.exp(-v))),
  linear: arr => arr,
};

function forward(input) {
  let x = Float32Array.from(input);
  for (const { inSize, outSize, act } of LAYERS) {
    const k = weights.shift();
    const b = weights.shift();
    x = activations[act](dense(x, k, b, inSize, outSize));
    weights.push(k, b); // restore so weights stays intact after first call
  }
  // undo the push-restore trick: rebuild from the flat buffer on each predict call
  return x;
}

async function loadAssets() {
  const [binBuf, normData] = await Promise.all([
    fetch('assets/model/group1-shard1of1.bin').then(r => r.arrayBuffer()),
    fetch('norm.json').then(r => r.json()),
  ]);

  norm = normData;

  // parse binary into ordered Float32Array slices
  const all = new Float32Array(binBuf);
  let offset = 0;
  const parsed = [];
  for (const { inSize, outSize } of LAYERS) {
    const kLen = inSize * outSize;
    parsed.push(all.subarray(offset, offset + kLen));  offset += kLen;
    parsed.push(all.subarray(offset, offset + outSize)); offset += outSize;
  }
  weights = parsed;

  document.getElementById('status').textContent = '✅ Model ready.';
}

function predict() {
  if (!weights) { alert('Model is still loading, please wait.'); return; }

  const inputs = [
    parseFloat(document.getElementById('alpha').value),
    parseFloat(document.getElementById('lambda').value),
    parseFloat(document.getElementById('sigma').value),
    parseFloat(document.getElementById('kappa').value),
    parseFloat(document.getElementById('kappa_').value),
    parseFloat(document.getElementById('A').value),
    parseFloat(document.getElementById('B').value),
    parseFloat(document.getElementById('m1').value),
    parseFloat(document.getElementById('m2').value),
  ];

  const xScaled = inputs.map((v, i) => (v - norm.x_mean[i]) / norm.x_std[i]);

  // run all 4 layers directly from the parsed weight arrays
  let x = Float32Array.from(xScaled);
  let wi = 0;
  for (const { inSize, outSize, act } of LAYERS) {
    x = activations[act](dense(x, weights[wi], weights[wi + 1], inSize, outSize));
    wi += 2;
  }

  const result = Array.from(x).map((v, i) => v * norm.y_std[i] + norm.y_mean[i]);

  ['E0', 'E1', 'E2', 'E3'].forEach((id, i) => {
    document.getElementById(id).textContent = result[i].toFixed(4);
  });
  document.getElementById('results').style.display = 'block';
}

loadAssets();
