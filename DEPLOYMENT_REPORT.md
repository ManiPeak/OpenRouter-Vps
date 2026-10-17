# 9Router distribution and validation report

- **Report date:** 2026-10-17
- **Distribution repository:** `ManiPeak/OpenRouter-Vps`
- **Intended default branch:** `main`

## Outcome

This repository contains the complete 9Router source tree needed for downstream users to:

1. fork `ManiPeak/OpenRouter-Vps` into their own GitHub account;
2. keep the personal fork's default/trigger branch on `main`; and
3. connect that personal fork to Railway, using the root `Dockerfile` and a persistent Volume mounted at `/app/data`.

The target repository itself is a standalone GitHub repository, not a GitHub fork. Exact upstream Git ancestry is intentionally not published; the distributable tree is an audited, sanitized snapshot. See `SOURCE_PROVENANCE.md`.

No Railway project or production service was created during this work. This report does not claim a Railway domain, source connection, runtime deployment, or production traffic that was not observed.

## Audited source

| Item | Value |
|---|---|
| Official upstream | `https://github.com/decolua/9router` |
| Upstream tag | `v0.5.104` |
| Upstream commit | `87a74e1bda3677193c6f71a7e2100c90311f0689` |
| Package version | `0.5.104` |
| License | MIT; upstream `LICENSE` retained unchanged |
| Snapshot contents | Application, CLI, Docker assets, docs, workflows, tests, static assets, and supporting files |

The exact upstream release workflow for this SHA had already built and smoke-tested Linux `amd64` and `arm64` container images. Local Docker validation was not possible in this workspace because no Docker daemon is available.

## Distribution-specific security changes

### API-key usage statistics

Usage aggregation no longer uses raw API keys as serialized object-property identifiers. It derives a collision-resistant `key-<64 hex>` HMAC-SHA-256 identifier keyed by `API_KEY_SECRET`, while retaining only a masked display value.

The tests cover:

- colliding display masks remaining separate;
- `24h` and `all` aggregation paths;
- current and legacy daily aggregation behavior; and
- absence of raw keys from serialized statistics.

### Google OAuth clients

Public Google OAuth client credentials from third-party desktop applications were removed from source, registry data, tests, and baselines. Antigravity and Gemini CLI OAuth now use deployment-owned values:

- `ANTIGRAVITY_OAUTH_CLIENT_ID`
- `ANTIGRAVITY_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`

A missing required client produces a clear configuration error. API-key-based Gemini and unrelated providers do not require these variables.

This sanitization is necessary because GitHub Push Protection rejects the old credentials anywhere in pushed ancestry. Security controls were not bypassed or disabled.

### Mirror workflow safety

The upstream GitBook workflow can publish to an upstream-owned external repository. A repository-identity condition keeps that workflow inert in this distribution mirror.

## Documentation delivered

`INSTALL_FA.md` documents the complete downstream flow in Persian, including:

- forking `ManiPeak/OpenRouter-Vps` into the installer's account;
- selecting the personal fork's `main` branch in Railway;
- root-Dockerfile detection;
- a single SQLite replica and `/app/data` Volume mount;
- strong unique secrets and secure cookies;
- optional deployment-owned Google OAuth clients;
- domain, `/api/health`, login, providers, and 9Router API keys;
- persistence and GitHub auto-deploy verification;
- safe sync from the distribution repository;
- backup, restore, secret rotation, troubleshooting, and rollback.

## Validation results

| Validation | Result |
|---|---|
| Native `better-sqlite3` in-memory read/write smoke test | PASS |
| Modified security/usage/OAuth unit tests | 27/27 PASS |
| Environment-owned OAuth tests alone | 5/5 PASS |
| Provider registry baseline | 94 providers, byte-for-byte PASS |
| OAuth URL baseline | Byte-for-byte PASS |
| Native HTTP/2 cleartext compatibility test | 1/1 PASS |
| Production `npm run build` | PASS |
| Build output | 150 static pages generated; standalone assets copied |
| Compiled server credential scan | No Google OAuth credential-shaped literals found |

The production build retained the four OAuth environment-variable names in server bundles, confirming runtime configuration was not replaced with embedded credentials.

Earlier no-cost runtime validation against the same audited application tree also covered health `200`, dashboard auth/login/password behavior, API-key enforcement, backup/import, SQLite persistence, and mock-provider routing/fallback/error behavior. No paid provider inference was performed.

### Test-suite note

Upstream does not define an `npm test` script and its `tests/unit` directory mixes Vitest files with Node's built-in test runner. Explicit change-focused suites pass. An ad-hoc broad Vitest selection also passed 296 tests, but eight pre-existing `oauth-cursor-auto-import` expectations are stale relative to the current route implementation; `cline-auth.test.js` is a Node test and is not a Vitest suite. Neither file is part of the upstream release workflow. These pre-existing test-harness inconsistencies were not represented as passing.

## Secret scanning

The distributable tree contains no literal matching either of the Google OAuth credential pairs that blocked the historical push, and no Google OAuth client-secret/client-ID pattern was found by the targeted scan. Placeholder values in `.env.example` and documentation are non-secret.

The final GitHub push remains the authoritative Push Protection check for the published commit.

## Railway contract verified from source

- Root `Dockerfile` exists.
- The container binds on `0.0.0.0`.
- Railway can inject `PORT` at runtime.
- Container data lives at `DATA_DIR=/app/data`.
- SQLite data is stored beneath `/app/data/db/`.
- The documented health endpoint is `/api/health`.
- Horizontal multi-replica use of one SQLite Volume is not recommended.

## Known limitations

1. No Railway credentials or connected Railway project were available, so no live Railway deployment evidence is claimed.
2. Docker is unavailable in this workspace; container evidence comes from the audited upstream exact-SHA workflow plus local native/runtime/build validation.
3. Google Fonts are unreachable from this sandbox. The clean production build used Next.js's documented mocked-font response hook with a local fixture; the fixture is outside the repository and is not shipped.
4. Upstream does not commit a root dependency lockfile and uses version ranges, so future dependency resolution is not perfectly reproducible.
5. Antigravity or Gemini CLI OAuth requires the deployer to create and manage a compatible Google OAuth client. No shared default client is published.
6. No paid API call, real provider credential, production secret, or public production domain was created.
