# PDG meson reference masses

This fixed snapshot uses the PDG 2025 update, accessed 2026-11-07. Sources and uncertainties are recorded per state in pdg-meson-masses.json. It is not an automatically refreshed feed.

## Comparison conventions

- All stored masses and uncertainties are in MeV (natural units, c = 1).
- The website displays GeV. Compute residual_MeV = 1000 * prediction_GeV - mass_MeV.
- Vector states use sigma = +1 (S = 1); pseudoscalar states use sigma = -3 (S = 0). All are S-wave states.
- Use the appropriate charm or bottom constituent-quark masses from the chosen AL1 parameter set. PDG meson masses are targets, not quark-mass inputs.
- Before mapping E0 to 1S and E1 to 2S, confirm the solver outputs are total meson masses for successive radial states at L = 0. Do not compare binding energies directly with PDG masses.
- psi(2S) uses PDG OUR FIT (uncertainty 0.011 MeV); the separately listed OUR AVERAGE has uncertainty 0.010 MeV.
- Experimental uncertainty is not the model's uncertainty. A residual includes potential-model discrepancy and surrogate error. Compare surrogate versus GEM separately.
- This dataset does not replace assets/model/reference.json, which tests numerical agreement with Python.

No prediction-to-state mapping or UI comparison is enabled by this data-only addition.


## Pseudoscalar caveats

The eta_b(2S) entry is omitted from the PDG 2025 summary table. Its listed Belle mass is 9999.0 +/- 3.5 (statistical), +2.8/-1.9 (systematic) MeV. Preserve these separate asymmetric components; uncertainty is null rather than a fabricated symmetric error. It is marked benchmark_default=false for exclusion from a default aggregate benchmark. Quantum numbers for eta_c(2S), eta_b(1S), and eta_b(2S) are quark-model assignments in these listings.

