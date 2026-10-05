# Required Group onboarding

## Table of Contents

- [Policy and recovery](#policy-and-recovery)
- [Semantic changes](#semantic-changes)
- [Delivery and cleanup](#delivery-and-cleanup)
- [Integration contract](#integration-contract)

## Policy and recovery

Owners configure the designated joining questionnaire with optional
`requiredCompletion`. New forms default to false; omission preserves an existing
policy. Admission is immediate. An enabled required form reports
`requiresCompletion: true` while current required answers are incomplete.
`canAccessMemberContent` reports current live, unbanned membership and completion
eligibility. Disabled or optional forms do not gate admitted members.

Ordinary Group roster reads enforce this policy through both session and REST.
Web and native expose a completion action before requesting restricted content.
Own status, retained records/history, submitting answers, leaving and account
controls remain reachable. Current owners and moderators retain narrowly necessary
roster management, private review, configuration and ownership resolution access.
Ownership consent does not require questionnaire completion. Those exceptions do
not create a general content bypass or Event role.

Independent Event membership, invitations and another qualifying audience grant
must remain valid. Completion saves answers without another admission review.
Former or banned authors see only their saved definitions and own history, never
new private Group questions. Rejoining reuses valid semantic-version answers.

## Semantic changes

Question IDs and material versions follow the persistent questionnaire contract:
type, required-answer semantics and sorted option values are material. Labels,
question ordering and option ordering are cosmetic. New or changed required
questions restore incompletion without deleting saved answers or definitions.
Disabling the form or required policy immediately removes the gate. Removing
requirements creates no new update broadcast.

## Delivery and cleanup

Required changes create bounded, cursor-paged jobs keyed by the required semantic
question set. Cosmetic configuration versions preserve queued jobs. Superseding
material edits or disabling cancel obsolete jobs. Each page atomically creates
recipient notifications and advances its cursor. Only current live, admitted,
unbanned and incomplete members receive notices; supported email, webhook and
push preferences and do-not-disturb state apply.

Scheduled external work contains notification IDs, never contacts, private answers
or definitions. Delivery resolves current eligibility and channel preferences;
completion or disabling prevents pending external delivery. Existing in-app
notices retain historical truth and link to current recovery state. Group deletion
purges jobs, dispatches and questionnaire data immediately. All three account
deletion paths purge author records and recipient dispatches and anonymize surviving
notification actor references. Pending policy work authorizes each page against
the current live, unbanned Owner, so accepted transfers preserve required notices
including cursor continuation. Deleting a former Owner clears job provenance while
preserving a matching Group policy under its valid successor; obsolete work is
removed. Jobs never retain a deleted actor ID.

## Integration contract

Future Group audience and tool grants must use
`canAccessGroupMemberContent(ctx, groupId, personId)` or
`requireGroupMemberContent`. `canEnterGroup` remains admission eligibility only.
`requireGroupRosterAccess` is a narrowly named management recovery exception.
Do not apply this gate to independent Event grants. Later Group application
admission must return the common current questionnaire status after membership.

REST configure accepts `requiredCompletion`; form, Group detail and invitation
acceptance expose the three new status booleans. CLI explicit policy writes require
`groupQuestionnaire.version: 2` before mutation. Existing basic optional operations
remain compatible with version 1. Version-1 responses default to optional policy
and report unknown content eligibility as null. CLI status provides the current completion and
access fields, and restricted reads identify the required recovery commands.
