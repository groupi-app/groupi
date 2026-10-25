# Shared content schema rollout review

This is a review plan, not an executable migration. No data-changing command is
authorized or included.

## Canonical source change

`posts.eventId` becomes optional and `posts.groupId` is an optional alternative.
New writes validate exactly one parent. Existing Event IDs and values remain
unchanged. Replies, attachments, post mutes, unread notifications and presence
keep canonical Post IDs. Additive Group indexes and optional notification fields
support new Group content without rewriting legacy rows.

The initial local checkpoint's separate Group Post tables were never pushed or
deployed by this task. The source removes those unshipped definitions and retains
Group API names solely as canonical storage adapters.

## Before any separately authorized deployment

1. Confirm target backend/frontend identity and source SHA with read-only evidence.
2. Inspect whether `groupPosts` or `groupPostReplies` tables exist on that target.
   If absent, no Post data migration is needed. Existing Event rows remain valid.
3. If either table exists, inspect counts/parents and stop removal. Do not assume
   they are empty, delete rows, or silently copy them. Preserve the old definitions
   temporarily and prepare an explicit export/map/verification proposal.
4. Any such proposal must map old Group Post/reply IDs to canonical IDs, preserve
   authors/timestamps/content/permissions, and retain old Group URLs through a
   durable alias adapter. Attachments, notification links, mutes and unread state
   must follow the identity map. Copying must be resumable and idempotent, with
   counts and per-record verification before any retirement decision.
5. Request approval for the exact target, migration procedure and rollback/data
   preservation plan. The current feature approval does not authorize executing
   that migration or deploying the backend.
6. Run real Convex codegen against the approved target, then matching authenticated
   web/native acceptance checks. Legacy Event clients/URLs, Event-only API grants,
   Group onboarding revocation, attachments, queued notification privacy and Bring
   List quantities/claims are explicit acceptance cases.

Existing draft-branch deployment suppression must remain in place until an
explicit deployment decision is made. Merging this PR would target `test`, whose
existing automatic workflow can deploy Convex; no merge is authorized here.
