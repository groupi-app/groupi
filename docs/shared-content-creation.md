# Shared content creation

This feature is based on `test` at `8fdbc93288fb5050cd3a133959850d97602cd2e3`.

## Current model and implementation order

The initial audit found independent persistent Group forms, lists and polls,
Event-only posts/replies, and a separate Bring List add-on. Group tool rows carry
Group ownership; their models enforce onboarding, exclusions, per-kind owner
policy, revision history and person-owned recovery. Bring List stores configured
quantities and per-person claim maps, which ordinary community list entries do
not represent.

The implementation therefore proceeds incrementally:

1. Add an optional Event owner alongside the existing Group owner on tool rows,
   configurations and contributions. New writes require exactly one owner.
   Keep the existing table names, Group indexes, API paths and saved records.
2. Adapt the existing tool models through `groupTools/context.ts`. Existing
   Group access and policies remain intact. Events use exclusion-aware Event
   membership, `createPosts` permission and organizer/moderator management.
   New Event create/list endpoints wrap the same models. Existing Group REST
   endpoints retain their Group-only wire contracts and reject Event tools.
3. Reuse the existing web/native tool screens through explicit Event scope
   adapters and new routes. Detail and management routes check the stored owner.
4. Add Group posts/replies with an additive model, shared hook factory, and
   web/native lifecycle routes. Leave existing Event discussion contracts intact.
5. Add the shared `+ New` menu, content discovery, regression tests and gallery
   fixtures, then run aggregate source checks and browser fixture verification.

## Feature disposition

| Feature    | Events                                                                               | Groups                                                                  |
| ---------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| + New      | Desktop dropdown, narrow drawer, native action sheet; current posting permission     | Same choices; per-kind tool policies determine availability             |
| Posts      | Existing rich discussion preserved                                                   | New paginated posts/replies, author/manager edit and confirmed deletion |
| Forms      | Reused form creation, responses, management, results and own history                 | Existing saved forms and policy behavior preserved                      |
| Lists      | Reused list creation, entries, management and own recovery                           | Existing saved lists and policy behavior preserved                      |
| Polls      | Reused voting, results, management and own history                                   | Existing saved polls and policy behavior preserved                      |
| Bring List | Existing add-on remains available through its original route and an Event Lists link | Not applicable                                                          |

Group posts currently use plain text and do not support attachments or post/reply
notification delivery. Existing Event post attachments, rich text, notifications
and routes remain unchanged. Event tool REST/CLI authoring is not added; the
existing Group REST/CLI endpoints remain Group-scoped.

## Data and permission compatibility

No one-time migration, deletion, credential change or backend deployment is
needed to prepare this source change. Existing Group rows satisfy the widened
validators. Event tool contributions retain their owner and use existing
revision/idempotency/privacy mechanisms. Event and Group deletion use owner
indexes to clean up their own content; person cleanup preserves the existing
history/anonymization conventions.

Bring List is deliberately coexistent. Nothing automatically disables,
reconfigures, copies or deletes its add-on configuration, claim maps or links.
Replacing its quantity/claim model requires a separate explicit decision and a
compatible migration design. Its existing confirmed management behavior remains
unchanged.

Destructive post/reply/tool actions retain explicit confirmation. Backend
permissions are checked from stored ownership during each transaction; a menu
or route guard is not authorization.

## Verification and open gates

Source tests and component fixtures do not prove live backend/device acceptance.
The isolated worktree has no configured Convex deployment. `pnpm generate` and
root `pnpm test:run` stop at the existing codegen prerequisite. Minimal generated
API module declarations were updated without provisioning a deployment; a real
codegen run remains required against an approved matching environment.

The backend can be fully tested offline with `pnpm --filter @groupi/convex
test:no-codegen`. Browser fixtures use a locally built Storybook and contain no
real app data. Full authenticated browser flows, actual native device behavior,
and VoiceOver announcements require a matching approved backend/frontend build
and an isolated signed-in identity.

Publishing also needs a deployment decision: `scripts/vercel-build.sh`
automatically deploys/configures a Convex preview for branch builds. Automatic
approval review rejected a proposed branch-only `git.deploymentEnabled` guard
in `vercel.json` because that persistent deployment-policy edit requires explicit
approval. The edit did not execute. No push or backend deployment should occur
until that decision is resolved. Changeset summary approval is also pending under
`docs/agents/workflow.md`.
