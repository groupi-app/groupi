# Groupi developer portal

Dedicated public, client-only developer documentation. The approved publishing
contract is in `docs/developer-portal-contract.md` at the repository root.

## Table of Contents

- [Validation](#validation)
- [Publication inputs](#publication-inputs)
- [Hosting](#hosting)

## Validation

```sh
pnpm --filter @groupi/portal content:generate
pnpm --filter @groupi/portal content:check
pnpm --filter @groupi/portal type-check
pnpm --filter @groupi/portal test:run
pnpm --filter @groupi/portal lint:tokens
```

Reader tests exercise the rendered public entry point without mocking internal
components or retrieval. Final browser acceptance is separately recorded with
actual viewport and accessibility observations; jsdom is not browser evidence.

## Publication inputs

Curated guides are explicitly allowlisted. CLI help comes from the existing CLI
generator, and API schemas come from the current Hono OpenAPI applications.
Source hashes identify freshness; source presence never implies deployment or
registry release. Exports and search use the same public corpus.

## Hosting

The intended output is a static React/Vite site, independent of the Groupi app.
Configure the host to serve `index.html` for reader paths while retaining actual
export files. No server rendering, app backend, credentials or external search
provider is required. Local builds and previews are permitted for verification;
production deployment and credential configuration require separate authorization.

Set `PORTAL_DOCS_ORIGIN` to the verified HTTPS docs origin for both
`content:generate` and `content:check` before a release build. The default
`http://localhost:4173` is deliberately a local preview URL, not a production
hostname. The Vercel production build rejects a missing public origin.

`/agents.md` and `/v2/agents.md` serve identical generated integration guidance.
Versioned task Markdown and `/llms.txt` share the human reader's allowlisted
content. Existing `/exports/*` downloads remain available. See
`public-headers.txt` and `vercel.json` for raw-document MIME types and fallback
exclusions; a missing Markdown path must return 404 rather than the app shell.
