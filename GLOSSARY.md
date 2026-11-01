# Groupi

Shared language for Groupi's event planning and participation features across
its web, mobile, and command-line interfaces.

## Language

**Organizer**:
An event member with the organizer role. This role applies to that event, not to
administration of the Groupi installation.
_Avoid_: Event admin

**Integration**:
A named, independent API actor sponsored by a current Event Organizer and limited to
explicit actions on selected Events. Its discussion contributions identify the
Integration as their author, not its sponsoring person. Sponsorship does not
grant blanket Organizer authority. Its integration principal has no person record,
Event membership or RSVP.

**Authorization grant**:
An explicit set of permitted actions and selected Events for a user or
Integration, or a user's expressly selected all-current-and-future Events.
A grant remains subject to current account, membership and role authority and
may expire or be permanently revoked; a credential cannot preserve authority
that its holder has lost.

**Bounded key**:
A secret API credential attached to an Authorization grant. It is distinct from
a legacy API key with collection permissions. Revoking a bounded key stops that
credential without implicitly revoking unrelated Integration identities.

**Developer app**:
A registered external client eligible to request delegated sign-in. Platform
approval controls who may use the app, independently of each person's consent.

**App connection**:
A person's consent for a Developer app on a particular Groupi instance, including
identity claims, permitted actions, Event selection and any separately approved
background access. Disconnecting stops future delegated access; it does not
delete information the app already copied or terminate the app's own session.

**Live resource view**:
An app's continuously refreshed, permitted representation of a Groupi resource.
It describes current state rather than a history of every change.

**Change record**:
A recorded occurrence about a Groupi resource, such as an RSVP change.
It is distinct from the Event that people plan and attend.

**Invite list**:
A private, creator-owned saved selection of existing Groupi users. Using a list
copies its current people into an invitation draft or explicitly sends ordinary
event invitations. Editing or deleting the list never changes an event or an
invitation already sent. An invite list has no group membership or event audience.

**Moderator**:
An event member with the moderator role, whose event-management permissions are
distinct from those of an organizer or attendee.

**Platform administrator**:
A user with administrative authority over a Groupi installation, distinct from
an organizer or moderator of an individual event.
_Avoid_: Event admin

**Group**:
A formal membership community whose members repeatedly hold events together.
A Group is independent of the events opened to its members.
_Avoid_: Team, squad, invite list

**Group member**:
A person admitted to a Group. Group membership is independent of membership
or an RSVP response for any individual event.

**Group owner**:
The single Group member responsible for its settings, management roles,
ownership and deletion. Group ownership grants no event-management role.

**Group add-on**:
A persistent tool enabled for a Group, with its own settings and member data.
Enabling it does not automatically enable it on events shared with that Group.

**Group moderator**:
A Group member authorized to manage invitations, admission applications and
ordinary members. This role is distinct from moderation of an individual event.

**Group application**:
A request to join a Group, with information used to decide admission.
_Avoid_: Group questionnaire, pending RSVP

**Event application**:
A request to join an event, with information used to decide admission.
_Avoid_: Event invitation, pending RSVP

**Admission policy**:
The rules by which a person becomes a Group or Event member. Admission is
independent of visibility and of a post-admission questionnaire.

**Visibility**:
The rules determining who can discover or view an event. Visibility does not
itself create membership or an RSVP response.

**Group questionnaire**:
Questions for admitted Group members, separate from questions used to decide
admission.
_Avoid_: Group application

**Group invitation**:
An offer to join a Group that admits its recipient upon acceptance, independently
of an admission application or event participation.

**Group onboarding**:
Requirements asked of an admitted Group member that, when required, gate
content granted through that Group. Onboarding is separate from admission.

**Group ban**:
A restriction preventing a person from being invited, applying or rejoining a
Group until lifted. It is distinct from removal and event banning.

**Event member**:
A person who participates in an individual event, with an event role and a
separate RSVP response.

**Completed Event**:
An Event whose end time has passed, or whose start date ended in its Event time
zone when no end time was set; previously explicit completion remains recognized.
Completion is distinct from an expired date poll.

**Needs new dates**:
An undecided Event whose proposed date options have all passed. Its memberships,
discussion and previous votes remain, and future options can make it upcoming again.

**Event audience**:
The people eligible to discover or view an event under its visibility rules.
Audience eligibility alone is independent of invitation, event membership,
and RSVP response.

**Discovery reason**:
An explanation of why a person is eligible to discover an event, such as their
membership in a Group.

**Friend**:
A Groupi user with an accepted personal friendship relationship to another user.
Friendship is independent of shared Group membership.

**Simple list**:
An Event- or Group-owned list of text entries without completion controls.
Switching from a checklist hides completion state without deleting it.

**Checklist**:
An Event- or Group-owned list whose entries can be completed under the list's
participation policy. Completion is one shared status per entry, not one status
per viewer. Personal entries remain restricted to their author and managers.

**Bring list**:
A list of required items and quantities, with participants claiming their own
quantities. New Bring Lists have independent Event or Group ownership. The
legacy Event Bring List remains backed by its original event add-on and claims.
A claim is distinct from checklist completion or an Event RSVP.

**Add-on**:
An optional event capability, such as reminders, a questionnaire, or the legacy
Event Bring List.

**Add-on template**:
A reusable definition of a custom add-on. Editing it does not automatically
change event add-ons already created from it.

**Event add-on**:
An add-on configured for a particular event. A custom event add-on uses that
event's saved version of its template, which can differ from versions used by
other events.

**Groupi Date Language (GDL)**:
A compact language for expressing proposed event dates, times, durations, and
recurrences. Relative expressions are interpreted against a reference time and
timezone.

**Discord Group connection**:
An association between one Group and an existing Discord server that supplies
community communication. Groupi governs Group admission; joining the Discord
server does not create Group membership.

**Discord access**:
Permission to participate in a Group’s connected Discord server, either through
a dedicated role or server membership. It is distinct from Group membership
and from linking a Discord account.

**Discord access mode**:
A Group’s choice of whether its Discord connection governs a dedicated role or
membership of the whole server.

**Role access mode**:
A Discord access mode in which Group membership governs a dedicated role rather
than membership of the whole Discord server.

**Server membership mode**:
A Discord access mode in which Group membership governs joining and removal
from the whole connected Discord server, which is reserved for one Groupi
Group connection.

**Managed Discord identity**:
A person's selected Discord account for Group-managed access. It is distinct
from the accounts that person can use to sign into Groupi.

**Managed Discord participant**:
A Discord account explicitly enrolled in a Group’s Discord access rules through
Connect Discord. Existing, unlinked server accounts are not managed participants.

**Managed Discord ban**:
A Discord server ban applied by the Group add-on because of a Groupi ban or
coordinated exclusion. It is distinct from a ban applied by Discord staff.
