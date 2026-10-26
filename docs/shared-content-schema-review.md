# Shared content schema rollout review

This is a review plan, not an executable migration. The later test-only rollout
authorization is conditional on a verified backup and isolated acceptance; it
does not authorize production changes or destructive restoration.

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
5. Confirm approval for the exact target, procedure and rollback/data preservation
   plan. The later authorization covers additive test-only rollout and isolated
   fixture access; destructive rewriting, retirement or restoring over current
   data still requires exact separate confirmation.
6. Run real Convex codegen against the approved target, then matching authenticated
   web/native acceptance checks. Legacy Event clients/URLs, Event-only API grants,
   Group onboarding revocation, attachments, queued notification privacy and Bring
   List quantities/claims are explicit acceptance cases.

The feature-branch deployment suppression remains in place. The later test-only
merge authorization applies only after verified backup and passing acceptance/CI.
The existing `test` workflow deploys the matching preview backend; production is
outside scope.

## Test rollout preflight — 2026-10-25

The user authorized merging into `test` with a verified backup before backend
changes. Authenticated Vercel metadata binds `test.groupi.gg` to preview commit
`f28087b63afd63e9e8e24bd188c09146519c4558`. Its public runtime configuration points
to the Convex deployment whose authenticated Management API metadata identifies
project 1513112, deployment 6295733, type `preview`, reference `preview/test`,
and `isDefault: false`.

Backup reference `groupi-test-pre436-1792952388617124773` was exported with file
storage included and retained privately in the authorized local workspace.
SHA-256: `384401d8475e8dac5b5f52af234a274cdfbaa558e3dcab5f82285585f0f6d6ec`.
CRC checks, JSON parsing and document/catalog identity uniqueness passed across
146 document files: 532 data records and 132 table-catalog records. Component data
is included; no storage payloads were present. A private manifest records per-table
counts and hashes. No restore was attempted against any deployment.

The live table inventory has no `groupPosts` or `groupPostReplies` tables. Existing
Event post IDs and relationships require no rewriting. This rollout needs additive
schema/index evolution only, with no data migration, deletion or table retirement.
Configured `pnpm generate` passed against the verified preview; it changes generated
declaration ordering only and does not activate the new application deployment.

At that preflight, authenticated acceptance was blocked: the preview had
`E2E_TESTING=true` but no
configured `E2E_FIXTURE_KEY`; the GitHub repository also has no fixture-key secret.
Creating this authentication capability required separate approval, subsequently
provided for test only. Isolated fixture authentication and provider isolation
remain required acceptance gates.

Rollback must preserve the additive schema after any new Group-parent records are
created. Do not revert to a schema requiring Event parents, overwrite current data,
or import the backup without separate confirmation. Prefer a compatible forward
fix or retain the union schema with the last compatible application code. The backup
provides a recovery source, not permission to discard intervening writes.

## Approved test-only continuation — 2026-10-26

The user approved configuring the test-backend/GitHub fixture key and creating
labelled isolated users/sessions with external delivery suppressed. The key was
configured through secure standard input; its value is not stored in source,
logs or reports. There are no fixture notification methods, push tokens or
provider connections, and authentication uses direct test-token verification
rather than requesting an email.

Authenticated identity was rechecked against the same non-default `preview/test`.
Fresh backup reference `groupi-test-pre436-1792978139892319883` has SHA-256
`252b9332ad930c77531bddea08bd00e75ac6bbebd58d321739a51917d0f07128`.
All 147 document files passed archive integrity, JSON and identity checks:
532 data records, 133 catalog records and zero file payloads. Component data and
a private per-table count/hash manifest are retained with the local export.

The candidate deployment dry run validated the schema and confirmed no index
deletions. Candidate functions/schema were then deployed only to the verified test
preview. A separate post-candidate export confirmed protected Events, Post IDs,
replies/attachments, notifications, add-on configuration/data and ordinary tools
were unchanged. No Post data migration or record rewrite was performed.

Real authenticated acceptance uses a matching candidate frontend and this backend.
Its scoped cleanup retires created Events/Groups through canonical operations,
then deletes only the exact newly created fixture account with its confirmation.
Uncertain cleanup retains an ID-only recovery manifest instead of broad deletion.
Final acceptance, exact-head CI and a still-current verified backup are merge gates;
PR #436 records their final results and deployed frontend/alias identity.
