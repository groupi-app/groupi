# Logging and error tracking

Groupi uses a console logger in the web app and Sentry instrumentation for web
errors and traces. Convex functions log through the Convex runtime. This guide
describes source configuration; it does not establish that a deployed instance
is receiving logs or alerts.

## Table of Contents

- [Web logging](#web-logging)
- [Sentry configuration](#sentry-configuration)
- [Convex logs](#convex-logs)
- [Debugging and privacy](#debugging-and-privacy)
- [Validation](#validation)

## Web logging

[`lib/logger.ts`](./lib/logger.ts) wraps `console.info`, `console.warn`,
`console.error`, and `console.debug`. It JSON-serializes extra data and optionally
prefixes messages with a trace ID. `createLogger(component)` adds a component
prefix; `createPerformanceTimer(label).end()` logs elapsed milliseconds.

```typescript
import { createLogger } from '@/lib/logger';

const logger = createLogger('event-list');
logger.info('Events loaded', { count: events.length });
```

The logger does not filter debug output by environment. Choose messages and
fields accordingly. `setTraceId` and `clearTraceId` control module-level state;
there is no automatic request-scoped propagation from middleware to React or
Convex. Pass correlation fields explicitly only where the target function's
validator accepts them.

Pino and Loki transports were removed from this logger. `LOKI_*` entries in the
environment template do not enable a transport in the current implementation.
Adding remote log delivery requires an explicit implementation and verification.

## Sentry configuration

The web app reads `NEXT_PUBLIC_SENTRY_DSN` from its environment:

```env
NEXT_PUBLIC_SENTRY_DSN=https://your-public-key@your-sentry-host/your-project-id
```

Configure your instance's project rather than copying another project's DSN.
The public DSN identifies the ingestion destination; build authentication tokens
are separate secrets.

Source files:

- [`instrumentation-client.ts`](./instrumentation-client.ts) initializes browser
  reporting. It disables Sentry in development, samples production traces at
  20%, and lazy-loads Replay after page load. Replay sampling is 10% of sessions
  and 100% on error.
- [`instrumentation.ts`](./instrumentation.ts) loads the Node or edge configuration
  and exports `captureRequestError`.
- [`sentry.server.config.ts`](./sentry.server.config.ts) and
  [`sentry.edge.config.ts`](./sentry.edge.config.ts) disable reporting in
  development, sample traces at 100%, and filter `ResponseAborted` errors.

Browser trace propagation targets Convex cloud endpoints and non-auth API routes.
Authentication routes are excluded to avoid large tracing headers. These settings
are configuration, not delivery or retention guarantees. Verify the deployed DSN,
sampling, alert rules, and data retention in the owning Sentry project.

## Convex logs

Use the Convex dashboard to inspect function logs and failures. Functions in this
repository use `console` directly; the previously documented
`convex/lib/logging.ts` and `convex/lib/error-handling.ts` helpers do not exist.
Do not copy examples importing them.

Use validated arguments and the domain's authorization helpers in queries and
mutations. Expected failures may use `ConvexError`; do not replace authorization
errors with a successful response. External network work belongs in an action,
not a mutation.

Any dashboard-managed Convex log streaming or Sentry integration is separate from
web Sentry instrumentation. Check the deployment's dashboard and current service
requirements before relying on one. This repository does not prove an integration
is enabled, its plan eligibility, retention, or delivery status.

## Debugging and privacy

1. Record the approximate time, affected route or function, and instance.
2. Inspect browser or Convex logs for the relevant failure.
3. If configured, inspect the corresponding Sentry event and permitted correlation
   fields. Do not assume a web trace ID was forwarded to Convex.
4. Reproduce with an isolated test identity and record what was observed.

Keep tokens, sign-in links, OTPs, passwords, API keys, and private event content
out of logs and reports. The console logger serializes supplied extra data without
redaction. Review Sentry payloads and Replay privacy settings before enabling
capture for an instance; reporting configuration does not establish consent or
prove that sensitive data is excluded.

## Validation

From the repository root:

```bash
pnpm --filter @groupi/web exec vitest run lib/logger.test.ts
pnpm check
```

These checks validate source behavior. Confirming ingestion, alerting, or retention
requires access to the matching deployed instance and observability project.
