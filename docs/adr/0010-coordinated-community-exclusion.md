# Coordinated community exclusion is an additional policy

An explicit coordinated expulsion commits persistent community exclusion independently
of ordinary Group removal, Group ban, and Event ban. It does not give Group staff
Event Organizer authority. Ordinary moderation retains the independent audience and
participation semantics in ADR 0002 (Group audiences and independent admission).

## Table of Contents

- [Commitment and authority](#commitment-and-authority)
- [History and recovery](#history-and-recovery)

## Commitment and authority

Current Group managers can commit exclusion, except against the Group owner.
The transaction captures ongoing, future, and undated Group-audience Event IDs,
actor, operation ID, and generation before any cleanup. Current Event authority is
assessed separately: missing Organizer authority and protected Organizer targets
produce blocked cleanup conflicts, while exclusion remains committed. Organizer
membership is never removed by initiation; ownership and last-Organizer safeguards
remain authoritative. Retained membership cannot bypass exclusion.

## History and recovery

Completed Events remain readable as history. Active exclusions fence captured IDs
and current Group audiences across other audience routes, including explicit
invitations. Audience additions and reactivation reconcile captured IDs inside the
write transaction. No general recurring series model is introduced.

Initiation never claims cleanup completion. G9 owns resumable removal and explicit
reinstatement, using the durable generation to reject stale work. Reinstatement
must restore no participation, invitations, bans, or announcement preferences.
