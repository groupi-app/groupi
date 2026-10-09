# Verification retrospective implementation — October 9, 2026

This is a historical validation record, not live deployment status. See
[current integration status](integration/current-status.md) for the feature handoff.
The implementation starts from `ce89496072d7fcb587268794db472ec90de2e895` in an
isolated checkout; original feature checkouts and investigation artifacts remain
unchanged. No production scheduler or application behavior was changed.

## Backend error enforcement

Before cleanup, strict execution of `addons.test.ts`, `events.test.ts` and
`invites.test.ts` passed 93 assertions but reported six unhandled scheduler errors
and exited 1. These suites now keep scheduled callbacks under fake timers and
clear them before returning to real timers. The same 93 assertions pass with no
unhandled errors. The full backend suite passes 106 files / 911 assertions with
strict handling enabled in the normal configuration.

An intentionally temporary test confirmed the enforcement independently:

```ts
it('proves CI rejects an unhandled rejection', async () => {
  void Promise.reject(new Error('RETRO_UNHANDLED_SENTINEL'));
  await new Promise(resolve => setTimeout(resolve, 20));
  expect(true).toBe(true);
});
```

Running that test through the normal Convex Vitest config passed its assertion
but exited 1 with the sentinel error. The temporary file was removed in `finally`;
it is not part of the passing suite. No production scheduler change or replacement
error suppression was needed.

The first full run was blocked by sandbox loopback restrictions in existing
CLI/API fixtures. Repeating with authorized loopback access passed. Such fixture
startup failures are distinct from the repaired scheduler errors.

PR CI subsequently exposed two additional late callback errors on Node 24 in
`event-applications-rest.test.ts`, despite all 911 assertions passing. That suite
now drains scheduled work before replacing its fixture and at teardown, then
asserts that every scheduled record succeeded or was canceled. With timers frozen,
the existing HTTP test deterministically fails this assertion without the drain;
all five REST tests pass after it. This executes the scheduled work rather than
suppressing its errors. The CI failure and focused RED/GREEN logs are retained.

## Coverage enforcement

Actual web/shared coverage runs with effective 70%/80% thresholds failed all four
global metrics despite passing assertions. The subsequent runs passed with the
explicit baseline floors in [the testing guide](../testing.md#coverage-requirements).
The coverage denominator was preserved. The targets remain improvement goals;
current coverage is not represented as meeting them.

## Browser, readiness and review

The maintained [history fixture](../../packages/web/e2e/history/README.md) passed
five isolated Chrome runs covering 19 behavior groups, with no browser errors or
external requests. CI runs it with bundled Chromium and retains its evidence.
The deployed navigation spec is discoverable but has not run against an
authenticated deployment.

Readiness has 15 offline checks. Authentication/cleanup fixtures have 17 focused
assertions, including rejection of query-string-only destination matches and
confirmation of the intended session. Independent standards review found the
URL-matching defect; it was fixed and re-reviewed with no remaining finding.
Independent spec review found the recommendations represented, with actual hosted
authentication and native verification explicitly outstanding.

Final aggregate runs pass: web 1,282 assertions with coverage enforcement, shared
279 assertions with coverage enforcement, mobile 580 assertions, and CLI 354
assertions.
Repository lint, type and format checks pass. No live test identity was created,
no deployment was initiated, and no hosted/native verification is claimed.

## Reproduction and evidence

Use the normal repository commands for package coverage, `pnpm check`,
`pnpm --filter @groupi/convex test:no-codegen`, the documented history runner, and
`node --test scripts/verification-readiness.test.mjs`. Backend/CLI integration
tests need loopback permission; none requires starting a development server.

Original detailed run logs remain outside this repository in the originating
workspace's `planning-docs/retro-*.log` files. Coverage RED/GREEN baseline logs and
metric summaries were retained there as well. This document records their outcomes
without making workstation-local artifacts a repository dependency.
