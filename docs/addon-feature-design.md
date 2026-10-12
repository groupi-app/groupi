# Add-on Feature Design

Agreed decisions for the first application of
[feature ownership](./adr/0002-feature-owned-application-modules.md).
The user confirmed the [consolidated architecture plan](./architecture-improvement-plan.md).
Implemented and validated in the working tree. The feature owns runtime,
authoring, creation adapters, hooks, and template models; ESLint enforces its
public interfaces. Required display-only custom add-ons also expose an explicit
completion action so attendees cannot be trapped by a valid template.

Validation: full web suite (1,075 tests before the final acknowledgement regression),
11 direct-page regression tests after that fix, repository lint and type checks,
and formatting checks passed. Browser validation was unavailable because the
expected local web server was not reachable.

## Accepted decisions

- One web add-ons feature owns runtime behavior, authoring, template settings,
  shared template definitions, and reusable field editors. Runtime and authoring
  remain separate internal modules; routes compose them.
- An explicit built-in catalog owns initialization and display order. Consumers
  do not repeat registration imports. Custom add-ons remain template data
  interpreted by existing renderers.
- Each event's saved custom add-on configuration determines its name, rendering,
  and completion requirements. Source-template edits do not silently change
  existing events, and visiting one event cannot change another event's behavior.
- Behavior fixes are in scope alongside the structural refactor. The intended
  outcome of each fix must be explicit and covered by regression tests.
- Tooling enforces imports through focused public entry points, beginning with
  add-ons. Runtime consumers do not pull in authoring code; other features adopt
  enforcement when they migrate.
- Required completion remains a navigation workflow rather than a new backend
  permission. Fix web initialization timing and content flashing before
  redirects, using the current event's configuration to determine requirements.
- The creation adapter supplies add-on configuration and relevant event-date
  context. Remove the obsolete in-memory wizard `reminderOffset` alias while
  preserving persisted event, REST, and scheduler compatibility. Removing those
  requires a separate data audit and migration decision.
- Disabled, missing, and unsupported add-ons show a clear unavailable state on
  direct URLs, with an explanation and a return-to-event link. Unusable forms
  are not rendered.
- This migration is web-focused. Mobile completion alignment is follow-up work
  because custom add-on completion currently opens the web experience and needs
  an explicit completion-and-return flow.

## Verification and implementation obligations

- Verify the real gating hook and initialization path. Existing web gating tests
  replace the production hook with a mock implementation.
- Cover event switching with different saved versions of one template, direct
  navigation to completion pages, built-in availability and order, and creation
  serialization. Preserve deliberate card-only and organizer behavior unless
  explicitly revised.
- Update contributor guidance with the new ownership and catalog conventions
  during implementation; the current add-on guide still requires self-registration.

Existing behavior to preserve within this refactor:

- Editing an event's custom add-on configuration resets its add-on data and
  notifies members. Existing backend tests explicitly cover this behavior even
  for a name-only edit; changing response retention is a separate product decision.
- Editing, unpublishing, or deleting a source template does not modify existing
  event copies. Disabling an event add-on clears its data.
- Creation and management use catalog order; event cards use saved-configuration
  order. Preserve each surface's ordering.
- Invalid built-in definitions fail during development and are reported and
  skipped in production. The explicit catalog must not introduce a production-wide
  crash policy.
