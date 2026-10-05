# Account Ownership Resolution

Account deletion resolves every current Group and Event responsibility before deleting
profile, private account records and authentication credentials.

## Ownership and final deletion

Group responsibility is `groups.ownerId`. Event responsibility and the Friends
visibility principal are `events.creatorId`; optional `createdById` is provenance.
A pending, declined or cancelled offer leaves ownership unresolved. Accepted
transfers preserve memberships, and Event transfers preserve RSVP and move the
Friends audience to the accepting Organizer. Explicit Group retirement preserves
independent Events. The final guard uses indexed current ownership, including
legacy inconsistent membership rows and ownership acquired after an earlier listing.

The self-service Convex mutation, platform-admin Person mutation, and v1/v2
admin REST target mutation share one authorized-target cleanup transaction. Each
entry preserves its own actor authorization. The guard runs before any application,
Group, Invite List, private preference or Auth cleanup. Orphan Person cleanup remains
available to authorized platform administrators; absent Auth does not bypass ownership.
Self-service deletion requires the current username. No entry automatically chooses
an Organizer successor or deletes an unresolved owned resource.

## Client and developer contracts

Web and native account settings subscribe to paginated owned resources and eligible
transfer recipients using app-injected Convex hooks. Progress reports unresolved
resources loaded; more pages remain available. Pending offers remain visible and
final deletion stays disabled until current readiness permits it. Resource deletion
requires a separate explicit confirmation. Action errors remain visible for retry.
Account/own-record controls do not add a required Group onboarding restriction.

`accountResolution.queries.listOwned({kind, paginationOpts})` returns
`{page,isDone,continueCursor}`. Each item has `{kind,id,title,status,transferId,
recipientId,resolved:false}`. `kind` is `GROUP` or `EVENT`; `status` is `NONE`,
`PENDING`, `ACCEPTED`, `DECLINED` or `CANCELLED`. A current principal is unresolved
even if its historical last offer says accepted. Accepted transfers disappear from
the former owner's live responsibility list. `readiness({})` returns
`{hasOwnedGroups,hasOwnedEvents,canDelete}` and is never a deletion authorization token.

REST v2 exposes `GET /account/responsibilities?kind=GROUP|EVENT&limit=1..100&cursor=...`
with `{items,nextCursor}`, `GET /account/readiness`, `POST /account/delete` with
`{confirmation}`, and explicit `DELETE /account/responsibilities/events/:eventId`.
The standard middleware applies `account:read`/`account:write` scopes and selected
API identity. Existing Group/Event transfer and Group retirement routes retain
resource scopes. Responses return conflict (409) for unresolved responsibilities;
invalid confirmation/forged fields return 400 and unauthorized scopes return 403.
See the [CLI reference](../packages/cli/docs/command-reference.md) for equivalent
commands and destructive confirmations. Final account deletion never retries an
ambiguous write automatically.
