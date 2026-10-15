# Group audience Event applications

A whole-Group Event audience can authorize the existing core Event application
when the Organizer chooses Apply for approval. This is Event admission, separate
from Group admission and post-admission Event questionnaires. Sharing itself
creates no invitation, membership or RSVP.

Submission and approval re-read current Public/Friends/Group audience eligibility
in the transaction. Group grants require live identity, current unbanned Group
membership and current required-onboarding completion. Leaving, removal, bans,
retirement, required-question edits and withdrawal end only that Group's grant.
Other qualifying audiences can still authorize approval. Event bans and blocks
prevent application admission even with another audience.

Only configured current Event reviewers decide applications. Group owner or
moderator status conveys no Event reviewer authority. A permitted Event manager
invitation is an explicit separate operation; it does not bypass the live
audience check during application approval.

Approval uses the existing duplicate-safe Attendee/Pending writer without a
second acceptance. Later Group changes preserve independent Event membership
and RSVP. Replaying a finalized decision never readmits a removed participant.

The existing web/native application forms, queues, REST routes and CLI commands
consume the same engine. `GET /events/{eventId}/applications/form` returns
`settings: null` when the author loses current Event read/review authority;
the private pending submission and paginated own history remain readable.
Current private questions and reviewer policy are not exposed by historical
record ownership. The application's direct route remains usable after logistics
access is lost. The existing 1–100 history/queue page bound remains unchanged.

CLI writes use ordinary `events` scopes and the existing application capability
check. A denied write prompts inspection of current reviewer/audience eligibility
and private records before retry; it does not issue an invitation or retry an
ambiguous mutation automatically.

Verification uses real authenticated Convex and HTTP boundaries, SDK/provider
mounted web/native controls, and an isolated CLI-to-localhost HTTP bridge. This
does not establish deployed-service or native device/VoiceOver behavior.
