'use strict';

// weights layout: [kernel(9×64), bias(64), kernel(64×64), bias(64), kernel(64×64), bias(64), kernel(64×4), bias(4)]

let model = null;
let norm    = null;


async function loadAssets() {
    try {
        model = await tf.loadLayersModel('assets/model/model.json');

        const response = await fetch('norm.json');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        norm = await response.json();

        document.getElementById('status').textContent = 'Model loaded successfully.';
    } catch (error) {
        document.getElementById('status').textContent =
        `Loading failed: ${error.message}`;

        console.error(error);
    }
}


function predict() {
  if (!model || !norm) { alert('Model is still loading, please wait.'); return; }

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

    const result = tf.tidy(() => {
        const inputTensor = tf.tensor2d([xScaled]);
        const outputTensor = model.predict(inputTensor);

        return Array.from(outputTensor.dataSync()).map(
            (value, i) => value * norm.y_std[i] + norm.y_mean[i]
        );
    });

    ['E0', 'E1', 'E2', 'E3'].forEach((id, i) => {
        document.getElementById(id).textContent = result[i].toFixed(4);
    });

  const resultsEl = document.getElementById('results');
  resultsEl.classList.remove('hidden');
  resultsEl.style.display = 'block';

  const spectrumData = [
    { name: "π(1S)",   jp: "0⁻", surrogateMass: 0.1528, expMass: 0.13957 },
    { name: "K(1S)",   jp: "0⁻", surrogateMass: 0.4100, expMass: 0.49368 },
    { name: "J/ψ(1S)", jp: "1⁻", surrogateMass: 3.0883, expMass: 3.0969 },
    { name: "J/ψ(2S)", jp: "1⁻", surrogateMass: 3.6861, expMass: 3.6314 },
    { name: "𝜂꜀ (1S)", jp: "0⁻", surrogateMass: 2.9964, expMass: 2.9839 },
    { name: "𝜂꜀ (2S)", jp: "0⁻", surrogateMass: 3.6375, expMass: 3.6011 },
    { name: "Υ(1S)", jp: "0⁻", surrogateMass: 9.4603, expMass: 9.4241 },
    { name: "Υ(2S)", jp: "0⁻", surrogateMass: 10.0233, expMass: 10.004 }
    
  ];
  drawmesonspectrum('#energyChart', spectrumData);

}

loadAssets();
