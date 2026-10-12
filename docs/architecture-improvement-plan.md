# Architecture Improvement Plan

All interview choices are settled and the user confirmed implementation. This
plan prioritizes modularity, clear ownership, and repository tidiness, with
behavior fixes included where explicitly defined. All four stages are implemented
in the working tree. Final validation covers source consumption without compiled
shared artifacts; compiled distribution verification runs in the existing CI
build job.

## Implementation sequence

1. [Add-on feature ownership](./addon-feature-design.md): establish the general
   feature convention with one web add-ons feature, separate runtime and
   authoring modules, enforced public entry points, an explicit built-in catalog,
   and event-specific custom behavior. Fix web initialization, redirect flashes,
   and unusable direct-link forms. Mobile completion alignment remains follow-up
   work.
2. [Backend domain ownership](./backend-domain-ownership-design.md): begin with
   events, then posts/replies, and apply the convention to remaining
   version-owned operations domain by domain. Preserve public entry points and
   transport contracts while correcting equivalent domain permissions and side
   effects across native, REST v1, and REST v2.
3. [Shared GDL](./shared-gdl-design.md): consolidate language behavior behind a
   runtime-neutral shared entry point, follow the documented grammar, and make
   reference time and timezone explicit. Apply the agreed overnight-range and
   daylight-saving policies, with one conformance suite for consumers.
4. [Workspace source ownership](./workspace-source-ownership-design.md): make
   workspace source consumption consistent, preserve compiled distribution,
   remove disposable tracked artifacts and verified duplicate generated trees,
   and consolidate stale or duplicate root configuration.

Each stage includes the minimum wiring necessary to work independently of later
cleanup; the broad resolution and artifact cleanup remains stage four. Retain
the current workspace roots and introduce deeper modules where demonstrated
ownership problems exist, rather than creating generic folders or packages.

## Verification and completion

- Each stage must meet the behavior and verification obligations in its linked
  design. Update contributor guidance as conventions change.
- Test real module interfaces and transport adapters. Include regressions for
  fixed defects; avoid replacement tests that merely reimplement production logic.
- Run `pnpm check` and relevant suites for implementation changes. Respect the
  repository's script restrictions; distribution and deployment build validation
  belongs in the permitted existing CI workflow.
- Preserve unrelated working-tree edits, public compatibility, and intentional
  version differences. No data migration or deployment is implied by this plan.
- User-facing fixes require a changeset with a user-confirmed summary, according
  to the repository's changeset policy.

The architectural rationale is recorded in
[ADR-0002](./adr/0002-feature-owned-application-modules.md),
[ADR-0003](./adr/0003-domain-owned-backend-operations.md),
[ADR-0004](./adr/0004-explicit-gdl-time-context.md), and
[ADR-0005](./adr/0005-source-first-workspace-consumption.md).

## Implementation evidence

All four stages are implemented and reviewed in the working tree. Final
`pnpm check` and `pnpm check:workspace-source` pass with shared `dist` absent.
The original-base suites passed 2,388 tests. Integration validation passes web
1,219, mobile 580, shared 434, and CLI 399 tests. One CLI timeout passed on an
unchanged rerun. The latest test branch bounds backend workers and treats
unhandled scheduler errors as failures. All 1,010 integrated backend tests pass
after preserving administrative event deletion cascades (3,642 total tests). Review found and fixed an invalid zero day-range
step, with parser and both HTTP-version regressions.

Compiled-package verification is wired into the existing CI build job and has
not run locally, respecting the repository's build restrictions. Configured
`pnpm generate` cannot run without `CONVEX_DEPLOYMENT`; canonical API references
were refreshed with the installed official generator template while preserving
component contracts. Browser verification remains unavailable because the local
web server was not reachable. The approved patch changeset is `.changeset/metal-rings-sell.md`. The architecture snapshot was committed and integrated onto `test` at `70ee9c3c`, preserving newer ownership-transfer, Group, attachment, participation, and CLI pagination behavior. Hosted checks and deployment verification remain the merge gate.

The first hosted build exposed a source ESM/CJS interoperability error in the
web token generator. Shared now declares ES module semantics, with compiled
ESM and CommonJS publication paths aligned to tsup defaults. The workspace
source check exercises actual named theme imports through the web tooling.
Compiled distribution and hosted preview checks remain required before merge.
