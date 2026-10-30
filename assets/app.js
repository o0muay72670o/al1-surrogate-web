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

  drawEnergyLevels('#energyChart', result);

}

loadAssets();
