# AneTrace

AneTrace is a lightweight, open-source workspace for intraoperative case replay and teaching annotations. It places public, de-identified monitoring trends on an interactive timeline so learners can mask future data, answer trend-recognition checkpoints, and attach notes to exact moments.

> **For education and research only.** AneTrace is not a medical device. It does not provide diagnoses, risk predictions, drug doses, or treatment recommendations and must not be used for clinical decisions.

## Features

- Replays 10 real, de-identified VitalDB cases with HR, MAP, SpO2, EtCO2, and BIS trends.
- Supports 30x-240x playback, timeline seeking, and reset controls.
- Masks unseen data in “Mask future” mode for case-based teaching.
- Pauses at generated trend checkpoints; every checkpoint is visibly marked for specialist review.
- Adds observation, discussion, and teaching notes at any timestamp.
- Stores annotations locally and supports JSON import/export without a backend.
- Includes persistent light and dark themes, responsive layouts, a PWA manifest, and basic offline caching.

## Quick start

Node.js 20.15 or later is required.

```bash
npm install
npm run dev
```

Production build and preview:

```bash
npm run build
npm run preview
```

## Data provenance and generation

The demonstration bundle is derived from [VitalDB v1.0.0 on PhysioNet](https://physionet.org/content/vitaldb/1.0.0/) under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The source-code license and case-data license are separate; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

`public/cases/cases.json` is a deployment-ready static bundle. Rebuild it from the official VitalDB API with:

```bash
python scripts/build_vitaldb_cases.py
```

The generator:

1. Fetches the official case and track catalogs.
2. Selects 10 fixed, traceable anonymous case IDs.
3. Loads HR, MAP, SpO2, EtCO2, and BIS tracks and rejects a build if any selected case lacks a required signal.
4. Applies basic physiological-range filtering and resamples at 10-second intervals.
5. Converts exact age to a decade band.
6. Generates trend-description checkpoints that remain marked `needs-expert-review`.

The generator does not infer diagnoses or produce treatment advice. An anesthesia specialist must review case selection, questions, answers, and explanations before formal teaching use.

## Project structure

```text
src/components/                 Replay, chart, checkpoint, and annotation UI
src/lib/                        Data loading, formatting, and local persistence
public/cases/cases.json         Generated static case bundle
scripts/build_vitaldb_cases.py  Reproducible VitalDB data generator
public/sw.js                    Basic offline cache
```

Read [CONTRIBUTING.md](CONTRIBUTING.md) before contributing. Source code is available under the [MIT License](LICENSE).
