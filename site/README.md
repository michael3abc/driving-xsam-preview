# Driving Scene Risk Understanding — Research Preview

Unpublished master's research on describing potential risks in short driving videos and locating the relevant object. This is an offline research preview, not a deployed driving assistant or a peer-reviewed performance claim.

**Research showcase — display permissions and publication approval are user-confirmed.**

## Preview

Open the self-contained [research preview](index.html) in a browser. It bundles its reviewed aggregate data and runtime: no CDN, tracking script, or model API is required. For an HTTP preview, serve only this directory on loopback:

~~~sh
python3 -m http.server 4179 --bind 127.0.0.1 --directory .
~~~

Then open http://127.0.0.1:4179/. No server-side model is included.

Keep `index.html` and `media/` together. This local candidate presents five hand-selected real examples in one 40-second montage with synchronized ground-truth/prediction risk captions and driving suggestions. Each two-second clip repeats four times in the montage. Five jump buttons and a concise case guide provide navigation without adding five duplicate players. These are offline predictions, not an overall success rate. Dataset annotations are reference text, not verified driving advice. Display permissions and publication approval are user-confirmed; imagery is retained without additional blurring after frame review. No independent legal verification or blanket media-reuse license is claimed.

## Selected measurements

One validation-selected checkpoint is used throughout; saved predictions were rescored without retraining or new model inference.

| Public-external evaluation | B4 | METEOR | CIDEr |
| --- | ---: | ---: | ---: |
| DRAMA-original, test | 0.609 | 0.431 | 3.987 |
| DRAMA-ROLISP, validation + test, fixed intention prior | 67.593 | 46.552 | 366.602 |

The first row uses 0–1 B4/METEOR and native CIDEr. The second uses percentage-style B4/METEOR and CIDEr ×100; intention is fixed to **“move straight”**, not learned. Do not compare the two rows as equivalent tasks. DRAMA-original scores 2,542 unique IDs from 2,544 registration rows; DRAMA-ROLISP scores 5,086 unique IDs from 5,088 rows. All public references are retained, with the first prediction used for a repeated ID.

The public report keeps three result tables only: a 12-row DRAMA-original paper-reported/measured comparison, a separate DRAMA-ROLISP comparison, and one compact bounding-box localization context table. Each reported row links to its source paper (arXiv where a verified arXiv version exists). **Among the methods listed here, our snapshot has the second-highest B4, METEOR, and CIDEr.** This concerns the 12 displayed predicted-box/non-GT-box values, not a field-wide rank. These are **paper-aligned comparisons**, not identical-reference head-to-head experiments; cross-run selection used test, so these are not unbiased held-out estimates. No SOTA, significance, or direct superiority claim is made. The localization table spans DRAMA-original, DRAMA-ROLISP, and an internal eligible-target protocol that includes pseudo-derived targets; it is context, not a controlled leaderboard.

## Implementation contribution

My implementation work covers dataset processing and validation, training/evaluation workflows, checkpoint recovery, and traceable experiment reporting. Scientific direction and publication involve advisor/collaborator review; this does not claim sole research ownership.

## Limitations

- Cross-run selection used test results. These scores are **not an unbiased held-out estimate**; within-run checkpoint selection used validation.
- Dataset splits share drives; no unseen-drive generalization is claimed.
- Generated descriptions and localization can be wrong. Caption overlap is not driving safety or decision accuracy.
- No real-time latency, deployment readiness, or multi-seed significance is established.

## Availability and sources

This repository candidate contains presentation material only. Core method, training code, configurations, weights, raw predictions, and datasets are not released. No dataset-media redistribution rights are granted by this preview. See the preview page for per-table paper links and protocol qualifications. No blanket release license is granted; dataset imagery and third-party material retain their applicable rights.
