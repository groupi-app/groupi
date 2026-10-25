# Shared GDL Design

Implemented decisions for consolidating Groupi Date Language behavior, following
the [consolidated architecture plan](./architecture-improvement-plan.md).

## Accepted decisions

- Expose one runtime-neutral GDL module through `@groupi/shared/gdl`, within the
  existing shared package. Keep its implementation independent of React, Convex,
  platform adapters, and design exports; a new general-purpose core package is
  unnecessary for the demonstrated consumers.
- Consolidate tokenizer, parser/evaluator, detection, and result types. Natural
  language parsing, UI formatting, hooks, and platform adapters remain outside
  this module. Existing callers retain compatible entry points during migration.
- Web, mobile, REST v1, and REST v2 follow the documented GDL grammar. Use shared
  conformance fixtures, preserve valid existing inputs, and add documented stepped
  ranges and duration ranges missing from the backend implementation. Resolve
  underspecified cases explicitly rather than treating either parser as correct
  by default.
- Reference time and timezone are explicit inputs to the parser's interface.
  Interpretation must not silently depend on the host's clock or timezone.
- Web and mobile callers explicitly supply the device timezone. REST accepts an
  optional timezone and uses UTC when omitted, preserving existing request shapes.
  Capture the reference instant once per operation; equivalent expressions and
  context produce identical results across consumers.
- Descending time ranges cross midnight. For example, `Fr@(22,2)` covers Friday
  22:00 through Saturday 02:00. Stepped overnight ranges follow the same rule.
- Nonexistent or ambiguous local times produce explicit errors identifying the
  affected occurrence. Calendar recurrences preserve their local clock time;
  durations measure elapsed time. Do not silently shift or select an occurrence.

## Verification and implementation obligations

- Move parser tests beside the shared owner; test the real public interface and
  equivalent consumer inputs across zones and daylight-saving transitions.
- Update the GDL specification and REST documentation with context defaults,
  overnight expansion, and daylight-saving errors. Cover legacy request shapes,
  invalid timezone input, stepped ranges, duration ranges, and overnight cases.
- Enforce the focused entry point's runtime dependency restrictions. This is
  import isolation; the existing shared package still declares React and Convex
  peers, so independent package installation is not promised.
- Preserve REST replay checks before relative-date parsing. A retry must not
  create different dates by reevaluating the expression against a later clock.
- Delete the backend parser after parity fixtures and adapter tests pass. The CLI
  currently uses explicit-offset ISO dates and does not need a new GDL dependency.

## Implementation evidence

Web and mobile previews import the focused shared entry point and provide their
device timezone and one captured reference instant. Both REST creation schemas
accept optional `timezone`; v1 preserves `GDL_PARSE_ERROR`, while v2 checks replay
and hashes the original body before expanding GDL.

The shared conformance suite exercises the real parser. The backend
`event-writes-rest.test.ts` suite exercises its conformance fixtures through both
HTTP adapters, plus omitted timezone, invalid zones, DST gaps/overlaps, and
idempotency binding to the original timezone. Event creation retains its existing
future-only validation when a valid GDL expression resolves an earlier instant
on the reference day. The duplicate backend parser has been removed after these
adapter checks passed. The GDL specification documents these contracts.
