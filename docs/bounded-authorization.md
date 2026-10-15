# Bounded API credentials

Groupi distinguishes legacy collection keys, bounded named keys, and delegated
access tokens. A credential never changes modes because its permissions or grant
are missing.

| Mode                  | Presentation                           | Authority                                                                                                           |
| --------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Legacy collection key | `x-api-key: grp_...`                   | Existing Better Auth collection read/write permissions; missing legacy permissions retain existing account behavior |
| Bounded named key     | `x-api-key: grp_b_...`                 | App-owned active credential, principal and grant, explicit actions and Event selector                               |
| Delegated access      | `Authorization: Bearer <opaque token>` | Consent grant plus eligible app, pinned instance, active short-lived credential and current user authority          |

Present exactly one credential. A named key cannot be presented as a delegated
Bearer token. Raw new secrets are hashed at the HTTP boundary before Convex
verification; only SHA-256 hashes are stored. Named keys are shown once. Revoked,
expired, missing or mismatched grant state fails closed; there is no fallback to
legacy account access.

## Principals and resource selection

A user principal acts as that user and remains limited by current membership,
role, ownership and configurable Event permissions. Its selector is either an
explicit list of Events or the explicitly selected **all current and future
Events** option. Losing membership removes effective access to that Event
without granting access anywhere else. A selected list never expands by itself.

An integration principal is an independent identity with a name and an Organizer
sponsor. It has selected Events only. The sponsor must remain the current
Organizer of each accessed Event and have an active account. The integration has
no person record, membership, RSVP or platform administrative role. Sponsor
identity supplies an authority ceiling; it never supplies discussion authorship.
Integration discussion content stores the integration principal as author and
native/web/mobile presentations distinguish it from a member. Integration edits
and deletes are limited to its own discussion content, even when its sponsor is
an Organizer.

Issuing or replacing bounds checks current authority. Replacing named-key bounds
cannot edit delegated consent: a new consent decision is required. Revoked grant
IDs remain revoked permanently.

## Implemented actions and projections

These bounds are enforced by the server, including guessed IDs and nested
resource expansions.

| Action                  | REST operation                                                   | Projection / extra checks                                                                                                                                    |
| ----------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `events.read`           | GET Events / Event                                               | Selected or explicit broad selector and current membership; creator email is always null                                                                     |
| `events.update`         | PATCH Event                                                      | Current Moderator+; Organizer required where existing date policy requires it; canonical Event writes and add-on lifecycle rules remain in force             |
| `members.read`          | GET Event members                                                | Current attendee-list visibility policy; no attendee email or private RSVP note                                                                              |
| `discussion.read`       | GET/list posts or replies                                        | Derive the parent Event and check it; author email is null; attachment expansion requires `files.read`                                                       |
| `discussion.create`     | POST Event posts / post replies                                  | Current domain creation policy; actual user or integration principal authorship                                                                              |
| `discussion.update`     | PATCH post / reply                                               | Current domain author/moderation rules for users; integration may edit only its own content                                                                  |
| `discussion.delete`     | DELETE post / reply                                              | Same actor checks; parent attachments and post notifications are cleaned up                                                                                  |
| `files.upload`          | v2 POST/DELETE uploads; attach/remove files in discussion writes | Upload requires `eventId`, attachment purpose, permitted type/size and matching stored metadata; unclaimed upload belongs to the actual actor and that Event |
| `files.read`            | v2 GET uploads / discussion attachment expansion                 | Derive attachment parent Event; an unclaimed upload is visible only to its owning actor                                                                      |
| `profiles.read`         | GET profile by username                                          | `eventId` query is required; target must currently belong to that granted Event; email, bio and pronouns are null                                            |
| `identity.display-name` | GET own profile                                                  | Explicit independent identity grant; name only                                                                                                               |
| `identity.email`        | GET own profile                                                  | Explicit independent identity grant; email only; does not imply display-name permission                                                                      |

Bounded Event listings return the actual user's role/RSVP for user credentials.
Integration listings return null for those human-only fields. Integration
principals cannot grant identity actions.

Event creation/deletion, membership management, invitations, RSVP/availability,
Event admission, add-on management, Groups, Invite Lists, social relationships,
account settings and platform administration are **unsupported bounded actions**.
They are not inferred from a legacy collection scope. Requests to unsupported
routes or methods fail closed. File upload/download descriptor routes are v2;
v1 supports bounded discussion attachment expansions but does not add upload
routes. New actions require an explicit validator/catalog entry and an
authoritative domain adapter before they can be granted.

## Mutation responses and version contracts

Bounded writes acknowledge identifiers only: Event PATCH returns `{eventId}`;
post/reply POST and PATCH return `{postId}` or `{replyId}`. They do not return
existing content, replies, authors or attachment URLs through a write-only
grant. Use a separately permitted read operation to retrieve projected data.

REST v2 returns those objects directly and DELETE returns 204. REST v1 retains
its `{success:true,data}` envelope and successful delete acknowledgement. Legacy
credential response behavior is unchanged. Browser clients use header-only
credentials; CORS supports API key/Bearer headers and unauthenticated preflight,
without cookie credentials.

## Revocation, authority changes and audit

Credential/grant/app/account/current Event authority is read inside the same
transaction as the requested operation. Canonical domain mutations invoked from
that mutation run as Convex subtransactions. Middleware verification is not the
write authority check. There is no authority cache or grace period.

A successful revocation acknowledgement means the revocation transaction has
committed. Already committed operations can complete. In-flight conflicting
transactions retry against the changed grant and deny further use. This does
not undo completed writes or revoke a storage URL already acquired by an
otherwise authorized request.

Account recovery revokes that user's named/delegated grants. It does not revoke
unrelated independent integration principals. Integration use still requires a
currently active sponsor account and current Organizer authority. Recovery does
not reactivate old consent.

Lifecycle audit is visible only to the grant owner/sponsor and stores identifiers,
operation, result, a fixed reason and timestamps. It stores no passwords, raw
keys/tokens/codes, email or resource bodies. Management shows the newest 100
entries. Scheduled retention removes records older than 90 days, processing
backlogs in bounded batches; scheduler execution is eventual.

## Additive migration

The new principal/grant/credential/audit tables and integration author/uploader ID
variants expand the schema. Existing person-authored records remain valid and do
not need a backfill. Legacy keys are neither converted nor silently narrowed.
New issuance, inspection and revocation coexist with explicitly labeled legacy
management. Removing legacy issuance or behavior requires a separately reviewed
contract/migration decision.

Local public-boundary tests cover issuance/inspection, selected Event denial,
permitted writes, revocation, role loss, independent integration authorship,
recovery scoping, Event-bound uploads, related file projection, minimal write
acknowledgements, independent identity projection and both versions' CORS.
Production browser/device acceptance, deployed transaction races, scheduler
latency and previously acquired storage URL lifetime need environment-specific
verification.
