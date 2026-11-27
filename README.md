# Driving-XSAM: driving-risk understanding with a video VLM

Master's thesis research (in progress): a video vision-language model that watches short driving clips, describes the potential risk, suggests a driving action, and localizes the object behind the risk. It connects [SAM 3.1](https://github.com/facebookresearch/sam3) segmentation features and a [Mask2Former](https://arxiv.org/abs/2112.01527) head with the [Cosmos-Reason2](https://github.com/nvidia-cosmos/cosmos-reason2) video-language model.

**Current results, examples and sources:** https://portfolio.yoyoserver.com/work/driving-xsam/

## Current results (updated 2026-11-27)

One model supplies every Driving-XSAM number below. Driving-XSAM is scored with the public reference protocol on the DRAMA test set; the other rows are values reported in the linked papers. These are paper-aligned comparisons: references, scorers and training conditions are not identical.

**Risk description, DRAMA (original) test** (sorted by CIDEr; — = not reported)

| Method | B4 | METEOR | ROUGE-L | CIDEr | Reported in |
| --- | ---: | ---: | ---: | ---: | --- |
| Rationale-based GIT (two-stage) | 0.621 | 0.438 | 0.756 | 4.132 | [IEICE Trans. Inf. & Syst.](https://www.jstage.jst.go.jp/article/transinf/E109.D/3/E109.D_2025EDP7067/_article) |
| **Driving-XSAM (this work)** | **0.604** | **0.428** | **0.740** | **3.952** | public reference protocol |
| LCP (with optical flow) | 0.547 | 0.391 | 0.700 | 3.724 | [arXiv:2501.04302](https://arxiv.org/abs/2501.04302) |
| SAT | 0.531 | 0.386 | 0.694 | 3.583 | [arXiv:2501.04302](https://arxiv.org/abs/2501.04302) |
| H-MBA | 0.536 | 0.394 | 0.697 | 3.227 | [arXiv:2501.04302](https://arxiv.org/abs/2501.04302) |
| ToMe | 0.536 | 0.403 | 0.758 | 2.9 | [arXiv:2409.11182](https://arxiv.org/abs/2409.11182v1) |
| Hints of Prompt | 0.563 | 0.417 | 0.798† | 2.8 | [arXiv:2411.13076](https://arxiv.org/abs/2411.13076v2) |
| PaPr | 0.531 | 0.397 | 0.752 | 2.8 | [arXiv:2409.11182](https://arxiv.org/abs/2409.11182v1) |
| VTS | 0.558 | 0.407 | 0.747 | 2.8 | [arXiv:2409.11182](https://arxiv.org/abs/2409.11182v1) |
| ADAPT | 0.608 | 0.455 | 0.753 | — | [arXiv:2507.06072](https://arxiv.org/abs/2507.06072v1) |
| MCAM | 0.624 | 0.453 | 0.755 | — | [arXiv:2507.06072](https://arxiv.org/abs/2507.06072v1) |

† Context-only: the reported protocol for this value differs.

Driving-XSAM has the second-highest CIDEr (3.95) among the 9 listed methods that report CIDEr; protocols differ. It is not second on the other columns: three listed methods report higher B4 and METEOR, and seven report higher ROUGE-L. This is not a field-wide ranking, and no state-of-the-art or direct-superiority claim is made.

**Risk-object localization, DRAMA (original) test, same model:** mIoU 75.3% and Acc@0.5 81.8% over all 2,544 human-box rows (missing boxes count as zero). Published localization results use different or incompletely specified protocols; for example, DRUformer reports a higher mIoU of 77.6%.

The portfolio page also has the localization, DRAMA-ROLISP, BDD-X, LingoQA and Cityscapes segmentation tables, an efficiency comparison, and selected examples.

## Interpretation limits

- Selection across models used test results, so the test set is a selection set, not an unbiased held-out estimate. Checkpoint selection within a model used validation.
- DRAMA splits share drives; unseen-drive generalization is not established.
- Caption-overlap metrics do not measure driving-decision accuracy. No real-time operation, deployment readiness or safety is claimed.

## Repository contents

- `site/`: the **2026-09 research-preview snapshot** (static page, five-case montage, reader notes and a LinkedIn draft). It came from an earlier checkpoint and evaluation setup. Its scores and its 12-row comparison are superseded by the results above and are kept unchanged only as a dated record.
- `release-manifest.json` and `tools/release.mjs`: the locked file list with hashes, and manual Cloudflare Pages tooling for that snapshot package.

No core research code, configurations, weights, raw predictions or datasets are released here. No blanket MIT or dataset-media reuse license is granted; dataset imagery retains its applicable rights.

## Implementation contribution

My work covers dataset processing and validation, training and evaluation workflows, checkpoint recovery, and traceable experiment reporting. Scientific direction and publication involve advisor and collaborator review; this does not claim sole research ownership.

## Maintaining the 2026-09 snapshot package

Cloudflare Pages uses Direct Upload to driving-xsam-preview, production branch main.
There is no Git integration or automatic deployment.
Use Node 22 and Wrangler 4.147.0 installed in an isolated local tools directory.
Browser-login first, then confirm the Cloudflare account and existing Direct Upload project.
The release command requires both the exact account ID and the path to that pinned Wrangler executable:

~~~sh
node tools/release.mjs verify
node tools/release.mjs deploy --account-id CONFIRMED_ACCOUNT_ID --wrangler /absolute/path/to/wrangler/bin/wrangler.js
node tools/release.mjs deploy --production --browser-receipt /absolute/path/to/verified-preview-browser-receipt.json --account-id CONFIRMED_ACCOUNT_ID --wrangler /absolute/path/to/wrangler/bin/wrangler.js
node tools/release.mjs readback --url VERIFIED_DEPLOYMENT_URL
~~~

Receipts and downloaded verification copies remain local under .release-receipts/ and are not committed.
On a failed first deployment, keep the evidence and do not claim publication success.
The first deploy command stages a preview, leaving an existing production version unchanged.
Production requires a browser-verified preview of these exact HTML bytes. On failed production readback, the tool restores and verifies the previous committed static package by Direct Upload.
Browser playback/seeking and privacy checks are separate required gates, not replaced by a successful upload or file hashes.
For browser failures after upload, restore the saved previous production deployment; preserve the failed deployment and receipt.
To reproduce a version, check out its publication commit, verify its locked package and manually deploy it again.
