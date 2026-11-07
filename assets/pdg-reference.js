'use strict';

async function loadPdgReferences() {
  const status = document.getElementById('pdg-status');
  try {
    const response = await fetch('assets/reference/pdg-meson-masses.json');
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();
    const labels = {
      jpsi_1s: 'J/ψ(1S)', psi_2s: 'ψ(2S)',
      upsilon_1s: 'Υ(1S)', upsilon_2s: 'Υ(2S)',
      etac_1s: 'ηc(1S)', etac_2s: 'ηc(2S)',
      etab_1s: 'ηb(1S)', etab_2s: 'ηb(2S)'
    };
    const body = document.getElementById('pdg-rows');
    body.replaceChildren();
    const states = [...data.states].sort((a, b) =>
      a.family.localeCompare(b.family) || b.S - a.S || a.n - b.n);
    for (const state of states) {
      const row = document.createElement('tr');
      row.className = 'border-t border-[#008822]';
      const components = state.uncertainty_components;
      const uncertainty = components
        ? '± ' + components.statistical + ' (stat.), +' + components.systematic_plus + '/−' + components.systematic_minus + ' (syst.)'
        : '± ' + state.uncertainty;
      const values = [
        labels[state.id] || state.name,
        state.family,
        state.S === 1 ? 'Vector (σ = +1)' : 'Pseudoscalar (σ = −3)',
        state.mass.toFixed(3) + ' ' + uncertainty,
        (state.mass / 1000).toFixed(6)
      ];
      for (const value of values) {
        const cell = document.createElement('td');
        cell.className = 'px-3 py-3';
        cell.textContent = value;
        row.appendChild(cell);
      }
      const source = document.createElement('td');
      source.className = 'px-3 py-3';
      const link = document.createElement('a');
      link.href = state.source_url;
      link.textContent = 'PDG listing' + (state.benchmark_default === false ? ' *' : '');
      link.className = 'underline text-[#39ff14]';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      source.appendChild(link);
      row.appendChild(source);
      body.appendChild(row);
    }
    status.textContent = data.source_edition + ' · Experimental masses; uncertainties in MeV. Predictions above are in GeV.';
  } catch (error) {
    status.textContent = 'Could not load PDG references. Refresh the page to retry.';
    console.error('PDG reference loading failed:', error);
  }
}
loadPdgReferences();

