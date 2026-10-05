# Groupi

Shared language for Groupi's event planning and participation features across
its web, mobile, and command-line interfaces.

## Language

**Organizer**:
An event member with the organizer role. This role applies to that event, not to
administration of the Groupi installation.
_Avoid_: Event admin

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
