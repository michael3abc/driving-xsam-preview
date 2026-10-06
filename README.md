# driving-xsam-preview

Private publication repository for the approved static research showcase.
The public webpage and media are downloadable; private repository visibility does not make them confidential.
No core research source, history, configurations, weights, raw predictions, source cache or rights evidence belongs here.
No blanket MIT or dataset-media reuse license is granted.

## Contents

- site/: the exact approved 16-file static package, including its reader documentation and LinkedIn draft.
- release-manifest.json: locked file allowlist, sizes and SHA256 values.
- tools/release.mjs: validate, manually upload, read back and retain deployment/rollback receipts.

Cloudflare Pages uses Direct Upload to driving-xsam-preview, production branch main.
There is no Git integration or automatic deployment. LinkedIn remains draft-only.

## Manual workflow

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
