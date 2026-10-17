# Source provenance

This repository distributes a complete source snapshot of **9Router** for users who want to fork it and connect their own fork to Railway.

## Audited upstream

- Project: [decolua/9router](https://github.com/decolua/9router)
- Upstream version: `v0.5.104`
- Upstream commit: `87a74e1bda3677193c6f71a7e2100c90311f0689`
- Snapshot review date: 2026-10-17
- License: MIT; the upstream `LICENSE` file and copyright notice are retained unchanged.

The application source, Docker assets, documentation, tests, public assets, and supporting files from that upstream revision are included in this repository.

## Why the Git ancestry is flattened

Some old upstream commits contain public Google OAuth client credentials. GitHub Push Protection rejects those historical blobs even when the current tree is cleaned. This distribution therefore publishes an audited source snapshot rather than importing the upstream Git ancestry. Repository security controls were not disabled or bypassed.

The distribution removes embedded Google OAuth credentials. Operators who use Antigravity or Gemini CLI OAuth must supply clients owned by their own Google Cloud project through the documented environment variables. Other providers, including API-key-based Gemini, are unaffected.

## Distribution-specific changes

Compared with the audited upstream snapshot, this repository includes:

1. a Persian Railway deployment and operations guide (`INSTALL_FA.md`);
2. a usage-statistics privacy fix that groups API-key usage with keyed HMAC identifiers rather than reversible/raw key material;
3. tests for the privacy fix and environment-owned Google OAuth clients;
4. a guard preventing this mirror from publishing upstream's GitBook deployment; and
5. documentation explaining the fork-to-Railway distribution model.

See `DEPLOYMENT_REPORT.md` for validation scope and known limitations.

## Update policy

Installers should sync updates from `ManiPeak/OpenRouter-Vps` into a branch of their personal fork, review/test them, and merge through a pull request. Do not merge the full historical upstream branch merely to preserve ancestry, do not force-push production branches, and do not disable GitHub Push Protection.
