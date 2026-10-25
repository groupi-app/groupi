# Backend Domain Ownership Design

Agreed decisions for moving reusable backend operations out of REST-version-owned
implementation directories. The user confirmed the
[consolidated architecture plan](./architecture-improvement-plan.md).
Implemented in the working tree: events, posts/replies, add-on data, administration,
reports, and remaining transport adapters now live with their domains.
Native paths and versioned HTTP contracts are preserved, with transaction-level
actor checks and shared discussion notifications.

Validation: 49 backend suites (700 tests) passed. Six known `convex-test` scheduler
warnings remain under the existing test configuration. Repository checks passed.
Configured Convex codegen is unavailable without deployment configuration; local
API references were refreshed using the installed official generator template,
preserving canonical component contracts.

## Accepted decisions

- Each domain owns its reusable operations and business behavior. Native Convex
  and versioned REST entry points adapt their respective transport concerns to
  those operations. Shared REST authentication lives outside version folders.
- Preserve public Convex function paths and versioned REST contracts while
  moving their implementation. Internal generated references may change.
- Confirmed behavior defects may be fixed, with explicit intended outcomes and
  regression coverage. Reorganization alone does not redefine published
  contracts or justify deleting version-specific schemas.
- Preserve [ADR-0001](./adr/0001-cli-rest-transport.md): the CLI and TUI consume
  REST v2, with equivalent permissions, validation, and side effects for
  equivalent operations across transports.
- Migrate events first, using existing shared domain operations and authenticated
  cross-transport tests as the foundation. Posts and replies follow, with a parity
  pass before consolidating their duplicated write behavior.
- Corrected domain permissions and side effects apply to REST v1 as well as v2
  and native operations. Preserve intentional transport differences, including
  v1 response envelopes and v2 status conventions. Reproduce each confirmed
  discrepancy in regression tests before changing it.

## Verification and implementation obligations

- Transport adapters obtain verified identity; REST adapters retain key scopes,
  rate limits, and key restrictions. Domain write operations enforce their
  actor's permissions within the write transaction rather than relying solely on
  a preceding transport query.
- Domain implementations must not import REST-version-owned operations. Preserve
  exported native entry points used by installed mobile clients as implementation
  moves behind them.
- Test shared domain policy and side effects through the domain interface, plus
  authenticated transport tests for v1/v2 contracts and native parity.
- Prioritize regressions for the inspected differences: v1 event updates bypass
  shared update behavior; REST post creation omits the native create-post
  permission and notifications; REST post edits omit author notifications.
  These findings come from source inspection, not executed reproductions.
