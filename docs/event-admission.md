# Event visibility, admission and membership

Event viewers can read permitted logistics before deciding to participate. Reading,
joining and confirming attendance are separate actions.

## Table of Contents

- [Visibility and admission](#visibility-and-admission)
- [Reading before joining](#reading-before-joining)
- [Portable controls](#portable-controls)

## Visibility and admission

`visibility` controls the existing audience: Public basic logistics remain public,
and Friends viewers must be accepted, unblocked friends of the current Organizer
(`events.creatorId`). Private events have no general nonmember audience.
Independent Event membership retains access when an audience grant changes.

The Organizer alone configures `admissionPolicy` as `INVITATION_ONLY` or `DIRECT`.
It does not alter visibility. An absent policy preserves historical behavior:
Friends events resolve to Direct; Public and Private events resolve to Invitation
only. Making a legacy event Public does not silently enable self-joining.
Applications are a later admission extension and are not exposed by this contract.

Direct joining rechecks the policy, current audience, blocks, bans and existing
membership in the write transaction. It creates Attendee membership with Pending
RSVP and the existing member count, join notification and member-joined lifecycle.
Ordinary authorized invitations remain independent grants: sending does not create
membership or RSVP, and acceptance remains Pending. Admission does not change
invitation authority, link/email transport, or Invite List replay semantics.

## Reading before joining

Session clients call `api.events.queries.getEventLogistics({eventId})`; REST clients
call `GET /api/v2/events/{eventId}/logistics`. The explicit payload contains only
Event identity, title, description, Organizer identity, location, timezone, cover,
chosen/proposed dates and resolved admission policy. It reports an `entryAction`:

- `MEMBER`: the caller already belongs to the Event.
- `JOIN`: the authenticated caller is currently eligible for Direct admission.
- `INVITATION_ONLY`: an explicit invitation is required.
- `SIGN_IN`: a public Direct event needs an authenticated identity before joining.
- `UNAVAILABLE`: the readable public event cannot currently admit this caller.

Reading does not create or update membership or RSVP. Discussion, attendee
identities, availability responses, add-on configuration/submissions and discussion
attachments remain behind Event membership and applicable permissions. Alternate
attachment and raw file-URL queries also enforce membership for discussion files.
The legacy session `getEvent` basic query uses the same safe projection and access
check; member-specific APIs retain their existing membership checks.

## Portable controls

Session clients use `api.events.mutations.updateAdmissionPolicy`; REST clients
PATCH `/api/v2/events/{eventId}/settings` with `admissionPolicy`. Settings reads
include the effective policy. `createEventAdmissionHooks` binds each app's own
Convex SDK hooks, preserving its authenticated provider context.

CLI clients use `events preview <event-id>` and
`events settings set <event-id> --admission-policy DIRECT|INVITATION_ONLY`.
Admission writes require `eventAdmission.version: 1`; join writes still require
`eventManagement.pendingRsvpJoin: true` before sending the request. Other existing
Event management operations remain compatible with version 1 servers.

Pending join RSVP remains distinct from scheduling: dated Events support explicit
RSVP, undated Events support availability. Poll date selection derives RSVP from
the latest availability; manual date selection preserves the current RSVP.
