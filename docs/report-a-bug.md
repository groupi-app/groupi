# Private bug report transport

Operational boundaries for the standalone manual reporting feature. Configuration and deployment are separate approval gates; this implementation does not enable the transport or send a live report.

## Table of Contents

- [Trust boundary](#trust-boundary)
- [Configuration](#configuration)
- [Limits and receipts](#limits-and-receipts)
- [Verification and release gates](#verification-and-release-gates)

## Trust boundary

The approved architecture exception is limited to `POST /api/bug-reports` and `POST /api/bug-reports/receipt`. These Next route handlers do transport work only. Convex owns authentication, validation, transactional admission, receipts, image sanitization, and sending.

The proxy runs only with Vercel's managed `VERCEL=1` environment and a valid `x-vercel-forwarded-for` IP supplied by that platform. It does not trust ordinary `x-forwarded-for`, browser-supplied network keys, cookies, identity fields, destination URLs, or arbitrary metadata. Do not manually set `VERCEL=1` on a publicly reachable local or unmanaged server: doing so would incorrectly declare its caller-controlled headers trusted. Another host needs a reviewed trusted-ingress adapter, not an environment-variable bypass.

The proxy HMACs the trusted IP with a server-only secret, forwards only its proof, the pseudonymous network key, JSON content type, and an optional unchanged Convex bearer token. Convex verifies the proof before reading the body. Both direct Convex HTTP paths reject missing or incorrect proof. The Node action and receipt mutations are internal, not public RPC functions. Authenticated identity is derived with `getCurrentPerson` inside the write transaction; it is never forwarded to Sentry. No account email is extracted.

The sender emits the supported Sentry `feedback` envelope format, without a browser SDK, synthetic exception, Replay processor, browser scope, or feedback breadcrumb. Selected images share the event envelope. Replay identifiers require explicit consent; browser replay upload remains the frontend consent adapter's responsibility. No server upload URL fetch or temporary attachment store exists.

Replay is offered only for an existing session-mode recording. Buffered error-only recordings are unavailable for manual attachment: flushing them would either stop independent error recording or promote it to continuous recording. Opening the form and toggling consent never flush, start, stop, or change recording mode. Only an opted-in Send flushes an existing session, preserving its recording, and requires observed transport acceptance. No full-session history is promised.

## Configuration

All application configuration below is server-only, without `NEXT_PUBLIC_` prefixes. Do not put actual values in source, logs, tickets, or documentation.

| Variable                     | Location          | Requirement                                                                                                                                                                                                                                                             |
| ---------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BUG_REPORT_PROXY_SECRET`    | Vercel and Convex | Matching cryptographically random secret, at least 32 and at most 256 characters; generate/configure only after separate approval.                                                                                                                                      |
| `BUG_REPORT_CONVEX_SITE_URL` | Vercel            | Exact HTTPS Convex `.convex.site` origin for the matching deployment; no credentials, path, port, query, or fragment.                                                                                                                                                   |
| `BUG_REPORT_SENTRY_DSN`      | Convex            | Pinned private project's HTTPS SaaS ingestion DSN. Accepted hosts are `o<digits>.ingest.sentry.io`, `.ingest.us.sentry.io`, and `.ingest.de.sentry.io`. No self-hosted or arbitrary destinations. Use the same project as existing replay if replay linking is desired. |
| `VERCEL`                     | Managed hosting   | Platform-provided trust signal; never a browser field or local development override.                                                                                                                                                                                    |

Missing or malformed configuration fails closed. Receipt lookup does not need the Sentry DSN, so previously accepted delivery can still be resolved during an ingestion outage. Rotate matching secrets together; rotation invalidates existing network buckets, so coordinate it as an operational security change. Pseudonymous network keys are stable within a secret generation to preserve rolling rate limits and are stored only in expiring abuse metadata.

Sharp is a declared runtime dependency and is marked external in `convex.json`, because its native decoder cannot be bundled into a Convex isolate. A deployment must install the locked version rather than resolve a stale linked development dependency. No backend Sentry SDK is required.

## Limits and receipts

- Final description plus optional steps label and steps: 4,096 Unicode code points. A conservative 8,192-byte feedback-context budget is additionally enforced to avoid downstream normalization silently trimming multibyte text. No silent truncation.
- Optional reply email: 254 characters. Context is limited to web platform and a bounded release identifier. URLs, account identities, arbitrary tags, logs, and automatic captures are not accepted.
- Images: at most three PNG/JPEG/WebP still images, 2 MiB aggregate original bytes, 8,192 pixels per axis, and 16 megapixels. Server checks canonical base64, signatures, decoder format, dimensions, animation, and malformed data. Sequential decoding has a five-second processing timeout per image. Re-encoding applies image orientation before stripping metadata and sanitized attachments are also capped at 2 MiB aggregate. Redaction is still the reporter's responsibility.
- Serialized intake: 4 MiB including internal metadata overhead; the proxy and Convex independently bound body reads. Receipt requests: 1 KiB. Proxy upload deadline: 10 seconds; backend fetch: 45 seconds; backend response: 4 KiB and five seconds. Sentry fetch: 15 seconds, with redirects disabled and no automatic retries.
- Admission: five attempts per rolling ten minutes per authenticated person or anonymous network key, plus twenty attempts per network per ten minutes and eight active sends globally. Limits and reservations are transactional. Receipt reads have a separate sixty-per-network-per-ten-minute bucket. Client debounce and CORS are not the abuse boundary.
- The random UUIDv4 submission identifier is an in-memory receipt capability. Never put it in URLs or logs. Receipt responses reveal only delivery state and the accepted event identifier, never content. A canonical payload digest prevents changing a report under the same identifier.
- Accepted receipts are reused without forwarding again. Confirmed failed attempts may be deliberately retried with the same identifier and immutable payload after their cooldown, consuming normal admission limits. Concurrent duplicates return `in-progress`. Unknown attempts never forward automatically; resolve the receipt first. Sending another report despite continued uncertainty requires an explicit duplicate-risk decision and a new identifier.
- Reservations have a two-minute lease; an interrupted attempt becomes observably unknown, not safely retryable. Receipts expire after 24 hours from their attempt, and rate metadata after ten minutes of inactivity. A five-minute cron prunes expired metadata in bounded batches. Nothing schedules report retries.

Only request identifiers, payload digests, attempt state, timestamps, acceptance identifiers, and short-lived abuse counters are persisted. Application logs contain only outcome codes and durations. There is no report-content table, image store, draft store, public issue, or report-history interface.

A Sentry 2xx means envelope acceptance, not triage, guaranteed attachment availability, replay retention, or a promised response. A lost response or 5xx may leave delivery unknown. Keep the user's draft and do not turn transport uncertainty into a success or definite failure.

## Verification and release gates

The test suite intercepts Sentry and exercises the public Convex HTTP boundary, the managed proxy, real image decoding, receipt recovery, and rate/concurrency limits. It must not submit to live Sentry. The approved frontend suite additionally covers the form and installed Replay behavior.

Before enabling: separately authorize secrets/configuration and deployment; verify the managed platform overwrites the trusted header, direct-origin bypass is rejected, frontend/backend contracts match, the locked native image decoder runs in deployed Node, and existing browser Replay uses the intended project. Live ingestion, authenticated hosted sessions, and production changes require their own authorization.

`pnpm generate` requires a configured Convex deployment and may be unavailable in an isolated checkout. Local API import-map emission does not verify deployment/component analysis; rerun full codegen in the authorized configured environment before release. Local tests are not evidence of a live deployment.
