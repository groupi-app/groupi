from __future__ import annotations
from typing import AsyncIterator, Iterator, Literal, NotRequired, TypedDict, Protocol, TypeAlias

class DelegatedToken(TypedDict):
    access_token: str
    instance: str
    audience: str
    expires_at: NotRequired[float]

class TokenProvider(Protocol):
    def __call__(self, *, instance: str, audience: str) -> DelegatedToken: ...

class ErrorResponse(TypedDict):
    error: Object3f70f6db216f


class EventSummary(TypedDict):
    id: str
    title: str
    description: str | None
    location: str | None
    imageUrl: str | None
    chosenDateTime: int | None
    chosenEndDateTime: int | None
    createdAt: int
    updatedAt: int
    memberCount: int
    userRole: Literal['ORGANIZER', 'MODERATOR', 'ATTENDEE', None]
    userRsvpStatus: Literal['YES', 'MAYBE', 'NO', 'PENDING', None]

class EventPageResponse(TypedDict):
    items: list[EventSummary]
    nextCursor: str | None

class EventCreateResponse(TypedDict):
    eventId: str
    membershipId: str

class CreateEventRequest(TypedDict):
    title: str
    description: NotRequired[str]
    location: NotRequired[str]
    potentialDateTimeOptions: NotRequired[list[Object044ce32ee4b4]]
    timezone: NotRequired[str]
    gdl: NotRequired[str]
    chosenDateTime: NotRequired[str]
    chosenEndDateTime: NotRequired[str]
    reminderOffset: NotRequired[Literal['30_MINUTES', '1_HOUR', '2_HOURS', '4_HOURS', '1_DAY', '2_DAYS', '3_DAYS', '1_WEEK', '2_WEEKS', '4_WEEKS']]

class EventDetail(TypedDict):
    id: str
    title: str
    description: str | None
    location: str | None
    imageUrl: str | None
    timezone: str
    potentialDateTimeOptions: list[Objectce98b1903941]
    chosenDateTime: int | None
    chosenEndDateTime: int | None
    reminderOffset: Literal['30_MINUTES', '1_HOUR', '2_HOURS', '4_HOURS', '1_DAY', '2_DAYS', '3_DAYS', '1_WEEK', '2_WEEKS', '4_WEEKS', None]
    createdAt: int
    updatedAt: int
    creator: Object0775184639f6 | None

class UserSummary(TypedDict):
    id: str
    name: str | None
    email: str | None
    image: str | None
    username: str | None

class UpdateEventRequest(TypedDict):
    reminderOffset: NotRequired[Literal['30_MINUTES', '1_HOUR', '2_HOURS', '4_HOURS', '1_DAY', '2_DAYS', '3_DAYS', '1_WEEK', '2_WEEKS', '4_WEEKS', None]]
    title: NotRequired[str]
    description: NotRequired[str]
    location: NotRequired[str]
    potentialDateTimeOptions: NotRequired[list[Object044ce32ee4b4]]


class MemberDetail(TypedDict):
    id: str
    role: Literal['ORGANIZER', 'MODERATOR', 'ATTENDEE']
    rsvpStatus: Literal['YES', 'MAYBE', 'NO', 'PENDING']
    joinedAt: int
    user: Object0ad4fa4c1cfd | None
    personId: str

class UpdateMemberRoleRequest(TypedDict):
    role: Literal['ORGANIZER', 'MODERATOR', 'ATTENDEE']

class MessageResponse(TypedDict):
    message: str

class RsvpUpdateResponse(TypedDict):
    membershipId: str
    rsvpStatus: Literal['YES', 'MAYBE', 'NO', 'PENDING']
    rsvpNote: str | None

class UpdateRsvpRequest(TypedDict):
    rsvpStatus: Literal['YES', 'MAYBE', 'NO', 'PENDING']
    rsvpNote: NotRequired[str]

class AvailabilityGridResponse(TypedDict):
    eventId: str
    potentialDates: list[AvailabilityGridEntry]
    userMembershipId: str

class AvailabilityGridEntry(TypedDict):
    potentialDateTime: PotentialDateTime
    availabilities: list[UserAvailability]
    summary: Object8820f6b447f2

class PotentialDateTime(TypedDict):
    id: str
    dateTime: int
    endDateTime: int | None
    note: str | None

class UserAvailability(TypedDict):
    membershipId: str
    user: UserSummary
    status: Literal['YES', 'MAYBE', 'NO', 'PENDING']
    note: str | None

class SubmitAvailabilityResponse(TypedDict):
    updated: int
    created: int

class SubmitAvailabilityRequest(TypedDict):
    responses: list[Object3e4107d97d81]



class FriendSummary(TypedDict):
    friendshipId: str
    personId: str
    userId: str
    name: str | None
    username: str | None
    image: str | None
    lastSeen: int | None


class FriendRequest(TypedDict):
    friendshipId: str
    personId: str
    userId: str
    name: str | None
    username: str | None
    image: str | None
    createdAt: int


class UserSearchResult(TypedDict):
    personId: str
    userId: str
    name: str | None
    username: str | None
    image: str | None
    friendshipStatus: Literal['none', 'pending_sent', 'pending_received', 'friends', 'declined', 'self']
    friendshipId: str | None

class FriendshipStatusResponse(TypedDict):
    status: Literal['none', 'pending_sent', 'pending_received', 'friends', 'declined', 'self']
    friendshipId: str | None

class FriendRequestResponse(TypedDict):
    friendshipId: str
    status: Literal['PENDING', 'ACCEPTED']
    message: str

class SendFriendRequest(TypedDict):
    personId: str


class AddonConfig(TypedDict):
    id: str
    addonType: str
    enabled: bool
    config: Object47d24df37cde | Object68e2071237a2 | Object4200ac2b790a | Objectb1df2f3763f1 | Object69802845beed
    createdAt: int
    updatedAt: int

class EnableAddonRequest(TypedDict):
    config: Object47d24df37cde | Object68e2071237a2 | Object4200ac2b790a | Objectb1df2f3763f1 | Object69802845beed

class UpdateAddonConfigRequest(TypedDict):
    config: Object47d24df37cde | Object68e2071237a2 | Object4200ac2b790a | Objectb1df2f3763f1 | Object69802845beed


class AddonDataEntry(TypedDict):
    id: str
    key: str
    data: str | dict[str, str | float | bool | None | list[str]]
    createdBy: str | None
    createdAt: int
    updatedAt: int

class SetAddonDataRequest(TypedDict):
    data: dict[str, str | float | bool | None | list[str]]


class Notification(TypedDict):
    id: str
    personId: str
    type: Literal['EVENT_EDITED', 'NEW_POST', 'NEW_REPLY', 'DATE_CHOSEN', 'DATE_CHANGED', 'DATE_RESET', 'EVENT_APPLICATION_RECEIVED', 'EVENT_APPLICATION_APPROVED', 'EVENT_APPLICATION_DECLINED', 'USER_JOINED', 'USER_LEFT', 'USER_PROMOTED', 'USER_DEMOTED', 'USER_RSVP', 'USER_MENTIONED', 'EVENT_REMINDER', 'FRIEND_REQUEST_RECEIVED', 'FRIEND_REQUEST_ACCEPTED', 'GROUP_INVITE_RECEIVED', 'GROUP_INVITE_ACCEPTED', 'GROUP_MEMBER_REMOVED', 'GROUP_MEMBER_BANNED', 'GROUP_APPLICATION_RECEIVED', 'GROUP_APPLICATION_APPROVED', 'GROUP_APPLICATION_DECLINED', 'GROUP_ANNOUNCEMENT', 'GROUP_ONBOARDING_REQUIRED', 'EVENT_INVITE_RECEIVED', 'EVENT_INVITE_ACCEPTED', 'ADDON_CONFIG_RESET', 'ADDON_AUTOMATION']
    read: bool
    createdAt: int
    group: NotRequired[Objectfa39780def0b | None]
    groupApplication: NotRequired[Object54bdd6572a9c | None]
    groupAnnouncement: NotRequired[Object21dc10e86adf | None]
    groupInvite: NotRequired[Object02c010229f76 | None]
    event: Objectfa39780def0b | None
    post: Objectfa39780def0b | None
    author: Objectd53e7a082e12 | None

class UnreadCountResponse(TypedDict):
    count: int

class MutedListResponse(TypedDict):
    events: list[MutedEvent]
    posts: list[MutedPost]

class MutedEvent(TypedDict):
    id: str
    eventId: str
    mutedAt: int
    event: Object0216e5b199fe | None

class MutedPost(TypedDict):
    id: str
    postId: str
    mutedAt: int
    post: Objectfa39780def0b | None

class Profile(TypedDict):
    personId: str
    userId: str
    name: str | None
    email: str | None
    image: str | None
    username: str | None
    bio: str | None
    pronouns: str | None

class UpdateProfileRequest(TypedDict):
    name: NotRequired[str]
    username: NotRequired[str]
    bio: NotRequired[str]
    pronouns: NotRequired[str]

class PrivacySettings(TypedDict):
    allowGroupInvitesFrom: NotRequired[Literal['EVERYONE', 'FRIENDS', 'NO_ONE']]
    allowFriendRequestsFrom: Literal['EVERYONE', 'EVENT_MEMBERS', 'NO_ONE', None]
    allowEventInvitesFrom: Literal['EVERYONE', 'EVENT_MEMBERS', 'FRIENDS', 'NO_ONE', None]

class UpdatePrivacySettingsRequest(TypedDict):
    allowGroupInvitesFrom: NotRequired[Literal['EVERYONE', 'FRIENDS', 'NO_ONE']]
    allowFriendRequestsFrom: NotRequired[Literal['EVERYONE', 'EVENT_MEMBERS', 'NO_ONE']]
    allowEventInvitesFrom: NotRequired[Literal['EVERYONE', 'EVENT_MEMBERS', 'FRIENDS', 'NO_ONE']]

class NotificationSettings(TypedDict):
    methods: list[NotificationMethod]
    typeSettings: list[NotificationTypeSetting]

class NotificationMethod(TypedDict):
    id: str
    type: Literal['EMAIL', 'PUSH', 'WEBHOOK']
    enabled: bool
    name: str | None
    value: str
    webhookFormat: Literal['DISCORD', 'SLACK', 'TEAMS', 'GENERIC', 'CUSTOM', None]

class NotificationTypeSetting(TypedDict):
    notificationType: str
    methodId: str
    enabled: bool

class UpdateNotificationSettingsRequest(TypedDict):
    notificationMethods: list[Object2999e75f7ec1]


class CustomTheme(TypedDict):
    id: str
    name: str
    description: str | None
    baseThemeId: str
    mode: Literal['light', 'dark']
    tokenOverrides: TokenOverrides
    createdAt: int
    updatedAt: int

class TokenOverrides(TypedDict):
    brand: NotRequired[Objectc24f606b22f3]
    background: NotRequired[Objectf82be304b3e2]
    text: NotRequired[Object76f39dd7d1f8]
    status: NotRequired[Object8747d622a8ab]
    shadow: NotRequired[Object0c58cdddeef8]

class ThemePreferencesResponse(TypedDict):
    selectedThemeType: Literal['base', 'custom']
    selectedThemeId: str
    selectedCustomThemeId: str | None
    useSystemPreference: bool
    systemLightThemeId: str
    systemDarkThemeId: str

class SetThemePreferenceRequest(TypedDict):
    selectedThemeType: Literal['base', 'custom']
    selectedThemeId: str
    selectedCustomThemeId: NotRequired[str | None]
    useSystemPreference: bool
    systemLightThemeId: str
    systemDarkThemeId: str

class CreateCustomThemeRequest(TypedDict):
    name: str
    description: NotRequired[str]
    baseThemeId: str
    mode: Literal['light', 'dark']
    tokenOverrides: NotRequired[Object7388a1973d88]

class UpdateCustomThemeRequest(TypedDict):
    name: NotRequired[str]
    description: NotRequired[str | None]
    baseThemeId: NotRequired[str]
    mode: NotRequired[Literal['light', 'dark']]
    tokenOverrides: NotRequired[TokenOverrides]

class InviteSummary(TypedDict):
    id: str
    eventId: str
    token: str
    name: str | None
    maxUses: float | None
    usesTotal: float | None
    usesRemaining: float | None
    expiresAt: float | None
    createdAt: float
    kind: Literal['link', 'email']
    email: str | None
    recipientName: str | None
    customMessage: str | None
    emailStatus: Literal['pending', 'queued', None]

class InvitePublic(TypedDict):
    id: str
    eventId: str
    eventTitle: str
    eventDescription: str | None
    eventLocation: str | None
    name: str | None
    expired: bool
    maxUsesReached: bool

class InviteListSendResult(TypedDict):
    eventId: str
    totalCount: float
    sentCount: float
    skippedCount: float
    results: list[Objecta40edc26256c | Object028edd10051b]

class InviteListSend(TypedDict):
    eventId: str
    role: NotRequired[Literal['ATTENDEE', 'MODERATOR']]
    message: NotRequired[str]


class InviteListPerson(TypedDict):
    personId: str
    name: str | None
    username: str | None
    image: str | None
    available: bool

class InviteListSummary(TypedDict):
    inviteListId: str
    name: str
    personCount: float
    availablePersonCount: float
    needsAttention: bool
    createdAt: float
    updatedAt: float

class UpdateInviteList(TypedDict):
    name: NotRequired[str]
    personIds: NotRequired[list[str]]

class DeleteInviteListResult(TypedDict):
    deleted: Literal[True]
    inviteListId: str

class InviteListPeople(TypedDict):
    items: list[SelectableInviteListPerson]


class InviteListCollection(TypedDict):
    items: list[InviteListSummary]

class CreateInviteList(TypedDict):
    name: str
    personIds: list[str]

class ReportCreateResponse(TypedDict):
    reportId: str

class CreateReportRequest(TypedDict):
    targetType: Literal['USER', 'EVENT', 'POST', 'REPLY']
    targetId: str
    reason: Literal['SPAM', 'HARASSMENT', 'HATE_SPEECH', 'INAPPROPRIATE_CONTENT', 'IMPERSONATION', 'OTHER']
    details: NotRequired[str]


class AdminUserSummary(TypedDict):
    userId: str
    user: UserSummary
    person: Object35e7b1a54aee | None
    createdAt: int

class SetUserRoleRequest(TypedDict):
    role: Literal['user', 'admin']


class AdminEventSummary(TypedDict):
    id: str
    title: str
    description: str | None
    location: str | None
    creatorId: str
    memberCount: int
    chosenDateTime: int | None
    createdAt: int
    updatedAt: int


class ReportSummary(TypedDict):
    id: str
    reporterId: str
    targetType: Literal['USER', 'EVENT', 'POST', 'REPLY']
    targetId: str
    reason: Literal['SPAM', 'HARASSMENT', 'HATE_SPEECH', 'INAPPROPRIATE_CONTENT', 'IMPERSONATION', 'OTHER']
    details: str | None
    status: Literal['PENDING', 'DISMISSED', 'ACTION_TAKEN']
    createdAt: int


class Object3f70f6db216f(TypedDict):
    code: str
    message: str

class Object044ce32ee4b4(TypedDict):
    note: NotRequired[str]
    start: str
    end: NotRequired[str]

class Objectce98b1903941(TypedDict):
    id: str
    start: float
    end: float | None
    note: str | None

class Object0775184639f6(TypedDict):
    id: str
    user: UserSummary

class Object4add9dfd0c54(TypedDict):
    id: str
    role: Literal['ORGANIZER', 'MODERATOR', 'ATTENDEE']
    rsvpStatus: Literal['YES', 'MAYBE', 'NO', 'PENDING']
    joinedAt: int
    user: Object0ad4fa4c1cfd | None
    personId: str
    rsvpNote: str | None

class Object0ad4fa4c1cfd(TypedDict):
    id: str
    name: str | None
    email: str | None
    image: str | None
    username: str | None

class Object8820f6b447f2(TypedDict):
    yes: int
    maybe: int
    no: int
    pending: int

class Object3e4107d97d81(TypedDict):
    potentialDateTimeId: str
    status: Literal['YES', 'MAYBE', 'NO']
    note: NotRequired[str]

class Object47d24df37cde(TypedDict):
    reminderOffset: str

class Object68e2071237a2(TypedDict):
    guildId: str
    guildName: str

class Object4200ac2b790a(TypedDict):
    items: list[Objectf6ca76572e97]

class Objectb1df2f3763f1(TypedDict):
    questions: list[Object3cd40e9719f2]

class Object69802845beed(TypedDict):
    templateId: str
    template: NotRequired[Object356518753784]

class Objectfa39780def0b(TypedDict):
    id: str
    title: str

class Object54bdd6572a9c(TypedDict):
    id: str
    status: Literal['PENDING', 'APPROVED', 'DECLINED', 'WITHDRAWN']

class Object21dc10e86adf(TypedDict):
    title: str
    message: str

class Object02c010229f76(TypedDict):
    id: str
    status: Literal['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED']

class Objectd53e7a082e12(TypedDict):
    id: str
    userId: str
    user: Objectd3056924d246

class Object0216e5b199fe(TypedDict):
    id: str
    title: str
    description: str | None
    location: str | None

class Object2999e75f7ec1(TypedDict):
    id: NotRequired[str]
    type: Literal['EMAIL', 'PUSH', 'WEBHOOK']
    enabled: bool
    name: NotRequired[str]
    value: str
    webhookFormat: NotRequired[Literal['DISCORD', 'SLACK', 'TEAMS', 'GENERIC', 'CUSTOM']]
    customTemplate: NotRequired[str]
    webhookHeaders: NotRequired[str]
    notifications: list[Objectf191154d01b8]

class Objectc24f606b22f3(TypedDict):
    primary: NotRequired[str]
    primaryHover: NotRequired[str]
    secondary: NotRequired[str]
    secondaryHover: NotRequired[str]
    accent: NotRequired[str]
    accentHover: NotRequired[str]

class Objectf82be304b3e2(TypedDict):
    page: NotRequired[str]
    surface: NotRequired[str]
    elevated: NotRequired[str]
    sunken: NotRequired[str]

class Object76f39dd7d1f8(TypedDict):
    primary: NotRequired[str]
    secondary: NotRequired[str]
    heading: NotRequired[str]
    muted: NotRequired[str]

class Object8747d622a8ab(TypedDict):
    success: NotRequired[str]
    warning: NotRequired[str]
    error: NotRequired[str]
    info: NotRequired[str]

class Object0c58cdddeef8(TypedDict):
    raised: NotRequired[str]
    floating: NotRequired[str]

class Object7388a1973d88(TypedDict):
    brand: NotRequired[Objectc24f606b22f3]
    background: NotRequired[Objectf82be304b3e2]
    text: NotRequired[Object76f39dd7d1f8]
    status: NotRequired[Object8747d622a8ab]
    shadow: NotRequired[Object0c58cdddeef8]

class Objecta40edc26256c(TypedDict):
    personId: str
    status: Literal['sent']
    inviteId: str

class Object028edd10051b(TypedDict):
    personId: str
    status: Literal['skipped']
    reason: Literal['ALREADY_MEMBER', 'INVITATION_PENDING', 'UNAVAILABLE']

class Objectf0baf57f0dd1(TypedDict):
    inviteListId: str
    name: str
    personCount: float
    availablePersonCount: float
    needsAttention: bool
    createdAt: float
    updatedAt: float
    people: list[InviteListPerson]

class Object4e7204ad5011(TypedDict):
    personId: str
    name: str | None
    username: str | None
    image: str | None
    available: Literal[True]

class Object35e7b1a54aee(TypedDict):
    id: str
    bio: str | None
    pronouns: str | None

class Objecta6ae99ae07d4(TypedDict):
    items: list[Object946aea546666]
    nextCursor: str | None

class Objectffbe1c9950c8(TypedDict):
    kind: Literal['GROUP', 'EVENT']
    limit: NotRequired[int]
    cursor: NotRequired[str]

class Object946aea546666(TypedDict):
    kind: Literal['GROUP', 'EVENT']
    id: str
    title: str
    status: Literal['NONE', 'PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED']
    transferId: str | None
    recipientId: str | None
    resolved: Literal[False]

class Object6660c3839c76(TypedDict):
    hasOwnedGroups: bool
    hasOwnedEvents: bool
    canDelete: bool

class Object2d05ad4bdae6(TypedDict):
    success: bool

class Object2af7fe0f9b46(TypedDict):
    confirmation: str

class Object0af774823b7d(TypedDict):
    eventId: str

class Object49bf06d9c16f(TypedDict):
    apiKey: str
    expiresAt: float
    account: Object65bba3d62a1c

class Objecte5faf1f089f2(TypedDict):
    code: str
    verifier: str
    state: str
    callbackPort: int

class Object5964056f794d(TypedDict):
    revoked: Literal[True]

class Object8ffbbe5fe6b2(TypedDict):
    eventId: str
    organizerId: str
    createdById: str
    transferId: str | None
    offeredById: str | None
    recipientId: str | None
    status: Literal['NONE', 'PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED']
    explanation: str

class Object63660964c4c7(TypedDict):
    eventId: str

class Object0c3e8abbf5ca(TypedDict):
    recipientId: str

class Object85dd26cb8024(TypedDict):
    transferId: str

class Object9e90c2c3d1a5(TypedDict):
    event: Objecte86accd2d51f
    organizer: Object5b24a1db1824 | None
    entryAction: Literal['MEMBER', 'JOIN', 'APPLY', 'INVITATION_ONLY', 'SIGN_IN', 'UNAVAILABLE']

class Object4a648d6fd5f5(TypedDict):
    items: list[Object6bb7463cee3b]
    nextCursor: str | None

class Objectf0fd2ef7e5a4(TypedDict):
    pagination: NotRequired[Literal['cursor']]
    limit: NotRequired[int]
    cursor: NotRequired[str]

class Object6bb7463cee3b(TypedDict):
    id: str
    title: str
    admissionPolicy: Literal['INVITATION_ONLY', 'DIRECT', 'APPLY']
    entryAction: Literal['JOIN', 'APPLY', 'INVITATION_ONLY', 'UNAVAILABLE']
    accessReasons: Objectb9a0c2603865
    description: str | None
    location: str | None
    chosenDateTime: float | None
    imageUrl: str | None
    organizer: Object78716c45d186 | None

class Object1d3bbf168039(TypedDict):
    membershipId: str
    success: bool
    role: Literal['ATTENDEE']
    rsvpStatus: Literal['PENDING']

class Objecte5a809dc5829(TypedDict):
    eventId: str
    visibility: Literal['PRIVATE', 'FRIENDS', 'PUBLIC']
    permissions: Object658127a26002
    admissionPolicy: Literal['INVITATION_ONLY', 'DIRECT', 'APPLY']

class Objectddbcd2fd4c82(TypedDict):
    visibility: NotRequired[Literal['PRIVATE', 'FRIENDS', 'PUBLIC']]
    admissionPolicy: NotRequired[Literal['INVITATION_ONLY', 'DIRECT', 'APPLY']]
    permissions: NotRequired[Objectf8ccad6cf3b8]

class Object37a4e2d22e60(TypedDict):
    audienceConflicts: list[Object8d74f2ccf6a9]
    revision: str
    completed: bool
    completedAt: float | None
    startsAt: float | None
    endsAt: float | None

class Object46a622af52af(TypedDict):
    operationId: str
    outcome: Literal['committed']
    result: Object83558e3bc551
    effects: Object14927e6acaac

class Object401e6f77e181(TypedDict):
    expectedRevision: str
    action: Literal['complete', 'reopen', 'reschedule']
    startsAt: NotRequired[float | None]
    endsAt: NotRequired[float | None]

class Objected2365fc2ed6(TypedDict):
    settings: Object9d78b8568e9e | None
    pending: Objectde38060a32b6 | None
    canApply: bool
    canReview: bool

class Objectb366528fe427(TypedDict):
    page: list[Objecta6e648a4652b]
    isDone: bool
    continueCursor: str
    splitCursor: NotRequired[str | None]
    pageStatus: NotRequired[Literal['SplitRecommended', 'SplitRequired', None]]

class Object7e06335c5475(TypedDict):
    limit: NotRequired[int]
    cursor: NotRequired[str]

class Objecta6e648a4652b(TypedDict):
    _id: str
    _creationTime: float
    eventId: str
    personId: str
    questions: list[Object6a6aeb3276ba]
    answers: dict[str, str | float | bool | list[str]]
    status: Literal['PENDING', 'WITHDRAWN', 'APPROVED', 'DECLINED']
    submittedAt: float
    updatedAt: float
    decisions: list[Object6388f0c60c78]

class Object9607a2178a0e(TypedDict):
    page: list[Object0597d5e84f7c]
    isDone: bool
    continueCursor: str
    splitCursor: NotRequired[str | None]
    pageStatus: NotRequired[Literal['SplitRecommended', 'SplitRequired', None]]

class Object0597d5e84f7c(TypedDict):
    _id: str
    _creationTime: float
    eventId: str
    personId: str
    questions: list[Object6a6aeb3276ba]
    answers: dict[str, str | float | bool | list[str]]
    status: Literal['PENDING', 'WITHDRAWN', 'APPROVED', 'DECLINED']
    submittedAt: float
    updatedAt: float
    decisions: list[Object6388f0c60c78]
    applicant: Objecta28dee2fad43

class Object85f20860c120(TypedDict):
    questions: list[Object6a6aeb3276ba]
    reviewerPolicy: Literal['ORGANIZERS_AND_MODERATORS', 'ORGANIZER_ONLY']

class Object8dc03c71a240(TypedDict):
    applicationId: str
    status: Literal['PENDING', 'WITHDRAWN', 'APPROVED', 'DECLINED']

class Objectec2c97973b61(TypedDict):
    answers: dict[str, str | float | bool | list[str]]

class Object715b53dc68f5(TypedDict):
    applicationId: str

class Object04868a1f6ada(TypedDict):
    decision: Literal['APPROVED', 'DECLINED']
    reason: NotRequired[str]

class Objectad794210902b(TypedDict):
    eventId: str

class Object0b4baf2fc1af(TypedDict):
    storageId: str | None
    imageUrl: str | None
    focalPoint: Object8fdfc205d0bb | None

class Object82edc32e8e2d(TypedDict):
    storageId: str

class Object2a37f36fe967(TypedDict):
    eventId: str

class Object8f2e07428f60(TypedDict):
    storageId: str
    focalPoint: NotRequired[Object8fdfc205d0bb | None]

class Objectaf5c4bdda5d7(TypedDict):
    id: str
    createdAt: float
    author: Objectc7f956fcace9 | None
    attachments: list[Object8be06601360f]
    eventId: str
    title: str
    content: str
    editedAt: float | None
    replyCount: float

class Object87783cbc6404(TypedDict):
    items: list[Objectaf5c4bdda5d7]
    nextCursor: str | None

class Object7b041e5fec41(TypedDict):
    parentId: str

class Object6cdac6024129(TypedDict):
    pagination: NotRequired[Literal['cursor']]
    limit: NotRequired[int]
    cursor: NotRequired[str]

class Objectbd43ca3d5411(TypedDict):
    id: str
    createdAt: float
    author: Objectc7f956fcace9 | None
    attachments: list[Object8be06601360f]
    eventId: str
    title: str
    content: str
    editedAt: float | None
    replyCount: float
    replies: list[Object009017a89888]

class Object34ab70d01c28(TypedDict):
    id: str

class Object60ee9f02bc5d(TypedDict):
    postId: str

class Objecte63be612b92f(TypedDict):
    title: NotRequired[str]
    content: NotRequired[str]
    text: NotRequired[str]
    attachments: NotRequired[list[Object8f4fd078f9a3]]
    attachmentsToAdd: NotRequired[list[Object8f4fd078f9a3]]
    attachmentIdsToDelete: NotRequired[list[str]]

class Object009017a89888(TypedDict):
    id: str
    createdAt: float
    author: Objectc7f956fcace9 | None
    attachments: list[Object8be06601360f]
    postId: str
    text: str
    updatedAt: float | None

class Objectfda4f2d5c7e6(TypedDict):
    items: list[Object009017a89888]
    nextCursor: str | None

class Object588b21707c8f(TypedDict):
    replyId: str

class Object3dd5d2118ecf(TypedDict):
    items: MemberListResponse
    nextCursor: str | None

class Object0a5f5ed92c94(TypedDict):
    eventId: str
    memberId: str

class Object1e88c8173d97(TypedDict):
    deletedCount: float
    membershipId: str

class Object248fc0ec5484(TypedDict):
    items: list[PotentialDateTime]
    nextCursor: str | None

class Object8cd0cdf0cfec(TypedDict):
    items: list[Objectc503c7ffa279]
    nextCursor: str | None

class Objectc503c7ffa279(TypedDict):
    potentialDateTime: PotentialDateTime
    status: Literal['YES', 'MAYBE', 'NO', 'PENDING']
    note: str | None
    availabilityId: str | None

class Objecte06d7904516b(TypedDict):
    items: list[Object59affbc4fdba]
    nextCursor: str | None

class Object5e8548e1584c(TypedDict):
    pagination: NotRequired[Literal['cursor']]
    limit: NotRequired[int]
    cursor: NotRequired[str]
    potentialDateTimeId: str

class Object59affbc4fdba(TypedDict):
    membershipId: str
    personId: str
    user: Object0ad4fa4c1cfd | None
    status: Literal['YES', 'MAYBE', 'NO', 'PENDING']
    note: str | None

class Object83d893372472(TypedDict):
    selectionSource: Literal['POLL']
    potentialDateTimeId: str

class Object3e2b6d8f36c1(TypedDict):
    selectionSource: Literal['MANUAL']
    chosenDateTime: str
    chosenEndDateTime: NotRequired[str]

class Object0b76429c8b74(TypedDict):
    items: list[FriendSummary]
    nextCursor: str | None

class Objectee0c1fb649a9(TypedDict):
    pagination: NotRequired[Literal['cursor']]
    limit: NotRequired[str]
    cursor: NotRequired[str]

class Object8bfb6348dae9(TypedDict):
    items: list[FriendRequest]
    nextCursor: str | None

class Objectb63cbd7183d3(TypedDict):
    q: str

class Object448825efceb1(TypedDict):
    targetPersonId: str

class Object96dfba5d30b4(TypedDict):
    friendshipId: str

class Object07b930802b31(TypedDict):
    announcementId: str
    state: Literal['PROCESSING', 'COMPLETED', 'CANCELLED']
    notified: int
    skipped: int

class Objectc3f4431a1c67(TypedDict):
    groupId: str

class Object5652b722bc8e(TypedDict):
    title: str
    message: str

class Objectb99f1ac5dcce(TypedDict):
    announcementId: str
    state: Literal['PROCESSING', 'COMPLETED', 'CANCELLED']
    notified: int
    skipped: int

class Object5d2a59b99424(TypedDict):
    requestId: str

class Object321903aa80bf(TypedDict):
    page: list[Objectb49cb191869a]
    isDone: bool
    continueCursor: str

class Objectabcad7a92e35(TypedDict):
    limit: NotRequired[int]
    cursor: NotRequired[str]

class Objectb49cb191869a(TypedDict):
    _id: str
    _creationTime: float
    groupId: str
    kind: Literal['FORM', 'POLL', 'LIST']
    title: str
    description: str
    resultsVisibility: Literal['MANAGERS', 'MEMBERS']
    creatorId: NotRequired[str]
    createdAt: float
    updatedAt: float

class Object003f9ced057a(TypedDict):
    toolId: str

class Object8f955e380d70(TypedDict):
    title: str
    description: NotRequired[str]
    resultsVisibility: Literal['MANAGERS', 'MEMBERS']

class Object1714fdefbeb4(TypedDict):
    _id: str
    _creationTime: float
    groupId: str
    kind: Literal['FORM', 'POLL', 'LIST']
    title: str
    description: str
    resultsVisibility: Literal['MANAGERS', 'MEMBERS']
    creatorId: NotRequired[str]
    createdAt: float
    updatedAt: float
    version: float
    canManage: bool

class Objectadc1f508905f(TypedDict):
    groupId: str
    toolId: str

class Objecte9e2a0e737a4(TypedDict):
    title: str
    description: NotRequired[str]
    version: int

class Object0e150b4bfa9f(TypedDict):
    page: list[Object32cc511c23d6]
    isDone: bool
    continueCursor: str

class Object32cc511c23d6(TypedDict):
    _id: str
    _creationTime: float
    toolId: str
    groupId: str
    personId: NotRequired[str]
    actorId: NotRequired[str]
    listTitle: str
    text: str
    completed: bool
    revision: float
    canEdit: bool
    canRemove: bool
    createdAt: float
    updatedAt: float

class Object2e89b7d741b1(TypedDict):
    entryId: str
    state: Literal['PRESENT', 'REMOVED']

class Objectc9c73e6f1496(TypedDict):
    version: int
    text: str

class Objectaa456dc0873a(TypedDict):
    revision: float

class Object2ef4e0f19715(TypedDict):
    groupId: str
    toolId: str
    entryId: str

class Objectcc99fe557380(TypedDict):
    version: int
    expectedRevision: int
    text: str
    completed: bool

class Objectef1fffec8cbc(TypedDict):
    expectedRevision: int

class Object98f4cc8bd3c7(TypedDict):
    groupId: str
    kind: Literal['LIST']
    enabled: bool
    creation: Literal['MANAGERS', 'MEMBERS']
    canConfigure: bool

class Object53a746cb1440(TypedDict):
    enabled: bool
    creation: Literal['MANAGERS', 'MEMBERS']

class Objectd2897b45c533(TypedDict):
    title: str
    description: NotRequired[str]
    questions: list[Object6a6aeb3276ba]
    resultsVisibility: Literal['MANAGERS', 'MEMBERS']

class Object8b0b6b6d7659(TypedDict):
    _id: str
    _creationTime: float
    groupId: str
    kind: Literal['FORM', 'POLL', 'LIST']
    title: str
    description: str
    resultsVisibility: Literal['MANAGERS', 'MEMBERS']
    creatorId: NotRequired[str]
    createdAt: float
    updatedAt: float
    version: float
    questions: list[Object6a6aeb3276ba]
    canManage: Literal[True]

class Objectda991d1da7bb(TypedDict):
    _id: str
    _creationTime: float
    groupId: str
    kind: Literal['FORM', 'POLL', 'LIST']
    title: str
    description: str
    resultsVisibility: Literal['MANAGERS', 'MEMBERS']
    creatorId: NotRequired[str]
    createdAt: float
    updatedAt: float
    version: float
    questions: list[Object6a6aeb3276ba]
    answers: dict[str, str | float | bool | list[str]]
    savedQuestions: list[Object6a6aeb3276ba]
    savedVersion: float | None
    responseRevision: float
    canManage: bool
    canReview: bool
    enabled: bool

class Object9afc4a5afed9(TypedDict):
    title: str
    description: NotRequired[str]
    questions: list[Object6a6aeb3276ba]
    version: int

class Object8195a916a385(TypedDict):
    page: list[Objectbe3c37f1eb4e]
    isDone: bool
    continueCursor: str

class Objectbe3c37f1eb4e(TypedDict):
    _id: str
    _creationTime: float
    toolId: str
    groupId: str
    personId: NotRequired[str]
    revision: float
    version: float
    questions: list[Object6a6aeb3276ba]
    answers: dict[str, str | float | bool | list[str]]
    createdAt: float
    updatedAt: float

class Object5db5384852d1(TypedDict):
    revision: int

class Objectcffe1fccdcde(TypedDict):
    version: int
    expectedRevision: int
    answers: dict[str, str | float | bool | list[str]]

class Objectfb48a02fd4cf(TypedDict):
    groupId: str
    toolId: str
    responseId: str

class Object632de87bce2f(TypedDict):
    groupId: str
    kind: Literal['FORM']
    enabled: bool
    creation: Literal['MANAGERS', 'MEMBERS']
    canConfigure: bool

class Object2072a1ae5071(TypedDict):
    title: str
    description: NotRequired[str]
    mode: Literal['SINGLE', 'MULTIPLE']
    options: list[Object6d5274c5de2d]
    resultsVisibility: Literal['MANAGERS', 'MEMBERS']

class Objectfd00f8f95b46(TypedDict):
    _id: str
    _creationTime: float
    groupId: str
    kind: Literal['FORM', 'POLL', 'LIST']
    title: str
    description: str
    resultsVisibility: Literal['MANAGERS', 'MEMBERS']
    creatorId: NotRequired[str]
    createdAt: float
    updatedAt: float
    version: float
    semanticVersion: float
    mode: Literal['SINGLE', 'MULTIPLE']
    options: list[Object6d5274c5de2d]
    canManage: Literal[True]

class Object1cf48926007e(TypedDict):
    _id: str
    _creationTime: float
    groupId: str
    kind: Literal['FORM', 'POLL', 'LIST']
    title: str
    description: str
    resultsVisibility: Literal['MANAGERS', 'MEMBERS']
    creatorId: NotRequired[str]
    createdAt: float
    updatedAt: float
    version: float
    semanticVersion: float
    mode: Literal['SINGLE', 'MULTIPLE']
    options: list[Object6d5274c5de2d]
    selections: list[str]
    savedOptions: list[Object6d5274c5de2d]
    savedVersion: float | None
    voteRevision: float
    canManage: bool
    canReview: bool
    enabled: bool

class Object800bf512e4e2(TypedDict):
    title: str
    description: NotRequired[str]
    mode: Literal['SINGLE', 'MULTIPLE']
    options: list[Object6d5274c5de2d]
    version: int

class Object6f22d6521161(TypedDict):
    page: list[Objectd968e063c948]
    isDone: bool
    continueCursor: str
    voteRevision: int

class Objectd968e063c948(TypedDict):
    _id: str
    _creationTime: float
    toolId: str
    groupId: str
    personId: NotRequired[str]
    revision: float
    version: float
    semanticVersion: float
    mode: Literal['SINGLE', 'MULTIPLE']
    options: list[Object6d5274c5de2d]
    selections: list[str]
    removed: bool
    createdAt: float
    updatedAt: float

class Object1e55c0550d05(TypedDict):
    page: list[Object430f2d180bd9]
    isDone: bool
    continueCursor: str

class Object430f2d180bd9(TypedDict):
    _id: str
    _creationTime: float
    toolId: str
    groupId: str
    personId: NotRequired[str]
    revision: float
    version: float
    semanticVersion: float
    mode: Literal['SINGLE', 'MULTIPLE']
    options: list[Object6d5274c5de2d]
    selections: list[str]
    removed: bool
    createdAt: float
    updatedAt: float
    isCurrent: bool

class Object29c0167f9b1d(TypedDict):
    version: int
    expectedRevision: int
    selections: list[str]

class Object8c477699d177(TypedDict):
    expectedRevision: int

class Objectb17b74c18a8f(TypedDict):
    groupId: str
    toolId: str
    voteId: str

class Object67ea0bf089d7(TypedDict):
    groupId: str
    kind: Literal['POLL']
    enabled: bool
    creation: Literal['MANAGERS', 'MEMBERS']
    canConfigure: bool

class Objectbb94019de7d2(TypedDict):
    operationId: str
    outcome: Literal['committed']
    exclusion: Literal['active']
    generation: float
    cleanup: Literal['pending', 'blocked', 'complete']
    conflicts: list[Object2c98a6bfd5c6]

class Object2da0580f7d57(TypedDict):
    personId: str
    policy: Literal['coordinated']

class Object1e5f701b7d0e(TypedDict):
    operationId: str
    outcome: Literal['committed']
    exclusion: Literal['active']
    generation: float
    cleanup: Literal['pending', 'blocked', 'complete']
    conflicts: list[Object2c98a6bfd5c6]

class Object73ecf7f47670(TypedDict):
    groupId: str
    personId: str

class Object598737a2dca1(TypedDict):
    items: list[Objectb7fb19a40d96]
    nextCursor: str | None

class Object96110c08a73a(TypedDict):
    limit: NotRequired[int]
    cursor: NotRequired[str]

class Objectb7fb19a40d96(TypedDict):
    joiningQuestionnaire: Objectb27f127421ba
    _id: str
    _creationTime: float
    ownerId: str
    name: str
    description: NotRequired[str]
    image: NotRequired[str]
    createdAt: float
    updatedAt: float
    role: Literal['OWNER', 'MODERATOR', 'MEMBER']
    viewerRole: Literal['OWNER', 'MODERATOR', 'MEMBER']
    canManageIdentity: bool
    memberCount: float
    eventSharingPolicy: Literal['MANAGERS', 'MEMBERS']
    canShareEvents: bool
    invitationsEnabled: bool
    applicationsEnabled: bool
    applicationQuestions: list[Object6a6aeb3276ba]
    canManageInvitations: bool
    canManageMembers: bool
    canManageRoles: bool
    canLeave: bool

class Object38a2ce79b0f1(TypedDict):
    groupId: str

class Objectfa3a9e641148(TypedDict):
    name: str
    description: NotRequired[str]
    image: NotRequired[str]

class Objectf2a3cfe95492(TypedDict):
    name: NotRequired[str]
    description: NotRequired[str | None]
    image: NotRequired[str | None]

class Objectcf55725f965c(TypedDict):
    contractVersion: Literal['red-room.v1']
    group: Object59509cf0ec83
    form: Objecta61bf08328e7
    membership: Object5b35bc95b99b | None
    eligibility: Objecta021a3f479e7
    applications: list[Object1c6ddd22f0f6]
    nextCursor: str | None
    grantedActions: list[str]
    allowedActions: list[str]
    announcementPreference: Object068ecbb0d0bb

class Objecta2791daed18f(TypedDict):
    cursor: NotRequired[str]

class Object6edaff610f96(TypedDict):
    kind: Literal['none']

class Object97dfec76315a(TypedDict):
    kind: Literal['conflict']
    code: Literal['STAFF_CONFIGURATION_CONFLICT']

class Object0b7836604670(TypedDict):
    kind: Literal['event']
    supportedRsvpChoices: list[Literal['PENDING', 'YES', 'NO', 'MAYBE']]
    allowedRsvpTransitions: list[Literal['PENDING', 'YES', 'NO', 'MAYBE']]
    event: Object8f7560a6b20e
    participation: Object427b94380342 | None
    allowedActions: list[str]

class Object53e85f30308a(TypedDict):
    operationId: str
    outcome: Literal['committed']
    result: Object878ec63794f7
    effects: Object14927e6acaac

class Objecte4ea0c62ce41(TypedDict):
    formRevision: str
    answers: dict[str, str | float | bool | list[str]]

class Object0210d908b1ed(TypedDict):
    groupId: str
    applicationId: str

class Objectece999219204(TypedDict):
    expectedRevision: int
    answers: dict[str, str | float | bool | list[str]]

class Object056f6599a34c(TypedDict):
    groupId: str
    enabled: bool
    requiredCompletion: bool
    requiresCompletion: bool
    canAccessMemberContent: bool
    version: float
    questions: list[Objectcb244cc36b34]
    answers: dict[str, str | float | bool | list[str]]
    savedQuestions: list[Objectcb244cc36b34]
    completed: bool
    shouldPrompt: bool
    canEdit: bool
    canConfigure: bool
    canReview: bool

class Object624371b3aebe(TypedDict):
    enabled: bool
    requiredCompletion: NotRequired[bool]
    questions: list[Object6a6aeb3276ba]

class Object6395deb0e4ba(TypedDict):
    version: int
    answers: dict[str, str | float | bool | list[str]]

class Object61969d67aaba(TypedDict):
    items: list[Object3cee5d7a2d66]
    nextCursor: str | None

class Object3cee5d7a2d66(TypedDict):
    groupId: str
    enabled: bool
    requiredCompletion: bool
    requiresCompletion: bool
    canAccessMemberContent: bool
    version: float
    questions: list[Objectcb244cc36b34]
    answers: dict[str, str | float | bool | list[str]]
    savedQuestions: list[Objectcb244cc36b34]
    completed: bool
    shouldPrompt: bool
    canEdit: bool
    canConfigure: bool
    canReview: bool
    author: Objecta28dee2fad43

class Object97987385f170(TypedDict):
    items: list[Objectb31c8114c447]
    nextCursor: str | None

class Object1611008fb05a(TypedDict):
    limit: NotRequired[int]
    cursor: NotRequired[str]
    authorId: NotRequired[str]

class Objectb31c8114c447(TypedDict):
    _id: str
    _creationTime: float
    groupId: str
    personId: str
    question: Objectcb244cc36b34
    answer: NotRequired[str | float | bool | list[str]]
    answeredAt: float

class Object1357fe91c2ec(TypedDict):
    items: list[Object478f41967623]
    nextCursor: str | None

class Object24f61c89eae7(TypedDict):
    limit: NotRequired[int]
    cursor: NotRequired[str]
    status: NotRequired[Literal['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED']]

class Object478f41967623(TypedDict):
    inviteId: str
    status: Literal['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED']
    createdAt: float
    respondedAt: float | None
    group: Objectafe89b003106
    inviter: Objecta28dee2fad43
    invitee: Objecta28dee2fad43
    available: bool
    canBan: bool

class Objectd246a5fb6d0b(TypedDict):
    inviteId: str
    status: Literal['PENDING']

class Object3ec0572a6d9e(TypedDict):
    inviteePersonId: str

class Objecte1c0fcf8b40a(TypedDict):
    items: list[Object7514791d9a3f]
    nextCursor: str | None

class Object7514791d9a3f(TypedDict):
    personId: str
    name: str | None
    username: str | None
    image: str | None
    role: Literal['OWNER', 'MODERATOR', 'MEMBER']
    joinedAt: float
    canRemove: bool
    canBan: bool
    canChangeRole: bool

class Object64c44083196e(TypedDict):
    invitationsEnabled: bool

class Objecte0128353cd2d(TypedDict):
    groupId: str
    membershipId: str
    status: Literal['ACCEPTED']
    joiningQuestionnaire: Object17c8fd7ccf8b

class Object7c5e30947e1c(TypedDict):
    inviteId: str

class Objecte375ea6b235c(TypedDict):
    status: Literal['DECLINED', 'CANCELLED']

class Object35141a46d0a7(TypedDict):
    items: list[Object1e56fe7dd0b1]
    nextCursor: str | None

class Object1e56fe7dd0b1(TypedDict):
    personId: str
    name: str | None
    username: str | None
    image: str | None
    bannedAt: float

class Objectbd478dc0c377(TypedDict):
    role: Literal['MODERATOR', 'MEMBER']

class Object80d270ff2592(TypedDict):
    groupId: str
    personId: str

class Object48e20440b294(TypedDict):
    role: Literal['MODERATOR', 'MEMBER']

class Objectdd6a39aba87a(TypedDict):
    removed: bool

class Object8bf4b7cfb096(TypedDict):
    banned: bool

class Object80c0f0a1db81(TypedDict):
    left: bool

class Object20854cd7c77a(TypedDict):
    groupId: str
    ownerId: str
    transferId: str | None
    offeredById: str | None
    recipientId: str | None
    recipient: Object5b24a1db1824 | None
    status: Literal['NONE', 'PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED']
    explanation: str
    canOffer: bool
    canAccept: bool
    canDecline: bool
    canCancel: bool

class Object5209c9e060c4(TypedDict):
    recipientId: str

class Object888d9185a767(TypedDict):
    transferId: str

class Object7ba2960d50b6(TypedDict):
    applicationsEnabled: bool
    questions: list[Object6a6aeb3276ba]
    pending: Object57afa53f5f81 | None
    canApply: bool
    canReview: bool

class Object8798ded7869a(TypedDict):
    success: Literal[True]

class Objecta66ce69c5289(TypedDict):
    applicationsEnabled: bool
    questions: list[Object6a6aeb3276ba]

class Objectcf0d5ee44ad5(TypedDict):
    items: list[Objectf006a1c397a2]
    nextCursor: str | None

class Objectf006a1c397a2(TypedDict):
    _id: str
    _creationTime: float
    groupId: str
    personId: str
    questions: list[Object6a6aeb3276ba]
    answers: dict[str, str | float | bool | list[str]]
    status: Literal['PENDING', 'WITHDRAWN', 'APPROVED', 'DECLINED']
    submittedAt: float
    updatedAt: float
    decisions: list[Object6388f0c60c78]

class Objectc3c66273bb38(TypedDict):
    items: list[Object84c39b4ad201]
    nextCursor: str | None

class Objecta91b1c668b6a(TypedDict):
    limit: NotRequired[int]
    cursor: NotRequired[str]
    status: NotRequired[Literal['PENDING', 'WITHDRAWN', 'APPROVED', 'DECLINED']]

class Object84c39b4ad201(TypedDict):
    _id: str
    _creationTime: float
    groupId: str
    personId: str
    questions: list[Object6a6aeb3276ba]
    answers: dict[str, str | float | bool | list[str]]
    status: Literal['PENDING', 'WITHDRAWN', 'APPROVED', 'DECLINED']
    submittedAt: float
    updatedAt: float
    decisions: list[Object6388f0c60c78]
    applicant: Objecta28dee2fad43

class Object4f75c6f32bec(TypedDict):
    applicationId: str
    status: Literal['PENDING', 'WITHDRAWN', 'APPROVED', 'DECLINED']
    joiningQuestionnaire: NotRequired[Object7892060edd7e]

class Objectb4f84fb246b8(TypedDict):
    answers: dict[str, str | float | bool | list[str]]

class Object1536187ddb0f(TypedDict):
    groupId: str
    applicationId: str

class Object400d4467dcf9(TypedDict):
    answers: dict[str, str | float | bool | list[str]]
    expectedRevision: NotRequired[int]

class Object026c1c76bdd8(TypedDict):
    decision: Literal['APPROVED', 'DECLINED']
    expectedRevision: NotRequired[int]
    operationId: NotRequired[str]

class Object6ca3b0de678c(TypedDict):
    eventId: str
    friendsShared: bool | None
    canManageEvent: bool
    groups: list[Object1590d2c92435]

class Object392afdf5c5c2(TypedDict):
    eventId: str
    friendsShared: bool

class Objectbc8e85e56367(TypedDict):
    enabled: bool

class Object6e16a7e029f2(TypedDict):
    policy: Literal['MANAGERS', 'MEMBERS']

class Object4a2b5fd38217(TypedDict):
    eventId: str
    groupId: str
    shared: bool

class Object507f8507399f(TypedDict):
    groupId: str
    eventId: str

class Object9f4b613046fe(TypedDict):
    items: list[Object7b5e95a37930]
    nextCursor: str | None

class Object7b5e95a37930(TypedDict):
    event: Objecte86accd2d51f
    canWithdraw: bool

class Object476a5720ad4f(TypedDict):
    items: list[Object90355adbcd73]
    nextCursor: str | None

class Object90355adbcd73(TypedDict):
    personId: str
    userId: str
    name: str | None
    username: str | None
    image: str | None
    blockedAt: int

class Object806772894c12(TypedDict):
    blockedByMe: bool
    blockedByThem: bool

class Object49e7860ab2a6(TypedDict):
    personId: str

class Object6ec7a36191ae(TypedDict):
    id: str
    addonType: str
    name: str
    description: str
    version: float
    template: Object356518753784

class Object4dc45c542b89(TypedDict):
    items: list[Object6ec7a36191ae]
    nextCursor: str | None

class Object82f2072d92bc(TypedDict):
    pagination: NotRequired[Literal['cursor']]
    limit: NotRequired[int]
    cursor: NotRequired[str]

class Objectb5ab3e5b460c(TypedDict):
    isOptedOut: bool

class Object556f4f3df304(TypedDict):
    id: str
    created: bool

class Object4a8443ff6a1a(TypedDict):
    eventId: str
    addonType: str

class Object0db44385f557(TypedDict):
    action: Literal['respond', 'claim', 'vote', 'toggle', 'execute', 'opt-in', 'opt-out', 'clear-response', 'clear-claims']
    data: NotRequired[dict[str, str | float | bool | None | list[str]] | None]
    fieldId: NotRequired[str]

class Object812fae11d33a(TypedDict):
    items: list[AddonConfig]
    nextCursor: str | None

class Objectb418e20abe35(TypedDict):
    items: AddonDataListResponse
    nextCursor: str | None
    isOptedOut: bool

class Object9c4e853d82c3(TypedDict):
    eventId: str
    addonType: str
    key: str

class Object04b6a50da866(TypedDict):
    items: list[Objectc05dd86f8b46]
    nextCursor: str | None

class Object032a0f41ed85(TypedDict):
    limit: NotRequired[int]
    cursor: NotRequired[str]

class Objectc05dd86f8b46(TypedDict):
    id: str
    name: str
    description: str
    iconName: str
    template: Object356518753784
    version: float
    isPublished: bool
    createdAt: float
    updatedAt: float

class Object7d2b597814a5(TypedDict):
    schemaVersion: Literal[1]
    name: str
    description: str
    iconName: str
    template: Object356518753784

class Objectc6fb40ac8b06(TypedDict):
    id: str

class Objectb56ae94c0c8e(TypedDict):
    schemaVersion: Literal[1]
    name: str
    description: str
    iconName: str
    template: Object356518753784
    expectedVersion: int

class Object36f05472f96c(TypedDict):
    id: str
    deleted: Literal[True]

class Objectda9a27f0c6c6(TypedDict):
    expectedVersion: int

class Objectca34d7164571(TypedDict):
    expectedVersion: int

class Object5d5f8bee642d(TypedDict):
    items: list[Objectbe0b70862b4b]
    nextCursor: str | None

class Objectbe0b70862b4b(TypedDict):
    id: str
    name: str
    status: Literal['available', 'invitable']
    authorizedAt: float
    expiresAt: float

class Object40c88df59ae9(TypedDict):
    count: float
    authorizedAt: float
    expiresAt: float

class Object18b73db2924a(TypedDict):
    items: list[Notification]
    nextCursor: str | None

class Objectbabf5e607dab(TypedDict):
    unread: NotRequired[Literal['true', 'false']]
    pagination: NotRequired[Literal['cursor']]
    limit: NotRequired[str]
    cursor: NotRequired[str]

class Object174160ee7be7(TypedDict):
    notificationId: str

class Object095137da4d81(TypedDict):
    success: bool
    count: float

class Objectf1a21e1989f5(TypedDict):
    scopeId: str

class Objectdb7ab33fdb88(TypedDict):
    type: NotRequired[Literal['events', 'posts']]

class Object3456af54a19b(TypedDict):
    postId: str

class Object436c0180a936(TypedDict):
    isMuted: bool
    eventMuted: NotRequired[bool]
    effectiveMuted: bool

class Object5b76758f449b(TypedDict):
    targetId: str

class Object3b39eec5432f(TypedDict):
    username: str

class Objectdbdbd17de31d(TypedDict):
    eventId: NotRequired[str]

class Object9e77b95ad3bf(TypedDict):
    themeId: str

class Object731c934869a4(TypedDict):
    items: list[InviteSummary]
    nextCursor: str | None

class Objecta640a0ba8b43(TypedDict):
    pagination: NotRequired[Literal['cursor']]
    limit: NotRequired[int]
    cursor: NotRequired[str]
    kind: NotRequired[Literal['link', 'email', 'all']]

class Object9022e42a11be(TypedDict):
    id: str
    token: str

class Object07989555863f(TypedDict):
    name: NotRequired[str]
    maxUses: NotRequired[int]
    expiresAt: NotRequired[str]

class Objectf584fd7f1513(TypedDict):
    createdCount: float
    inviteIds: list[str]
    queuedCount: float

class Objectc776b2dc18c6(TypedDict):
    invites: list[Object5153d73d401b]
    customMessage: NotRequired[str]
    expiresAt: NotRequired[str]
    send: NotRequired[bool]

class Objectdcad510e393d(TypedDict):
    username: str
    role: NotRequired[Literal['ATTENDEE', 'MODERATOR']]
    message: NotRequired[str]

class Objectdb08a32dcd8d(TypedDict):
    items: list[Object5a58404c1848]
    nextCursor: str | None

class Objecta63b72eda942(TypedDict):
    pagination: NotRequired[Literal['cursor']]
    limit: NotRequired[int]
    cursor: NotRequired[str]
    status: NotRequired[Literal['PENDING', 'ACCEPTED', 'DECLINED', 'all']]

class Object5a58404c1848(TypedDict):
    inviteId: str
    eventId: str
    eventTitle: str
    inviterId: str
    inviteeId: str
    role: Literal['ATTENDEE', 'MODERATOR']
    status: Literal['PENDING', 'ACCEPTED', 'DECLINED']
    message: str | None
    createdAt: float
    respondedAt: float | None

class Object4f3c5a171fbb(TypedDict):
    queuedCount: float

class Object4be4d8df39e5(TypedDict):
    inviteId: str

class Objected266440fefc(TypedDict):
    name: NotRequired[str]
    maxUses: NotRequired[int | None]
    expiresAt: NotRequired[str | None]

class Object69a2ba95f89c(TypedDict):
    token: str

class Object56c24524625c(TypedDict):
    eventId: str
    membershipId: str

class Objecte46080489a7f(TypedDict):
    inviteListId: str

class Object880d986ee587(TypedDict):
    q: str

class Object977c52831acc(TypedDict):
    userId: str

class Objectb3ad4a317683(TypedDict):
    storageId: str
    filename: str
    mimeType: str
    size: float
    url: str | None

class Object8ecd2a9b43ab(TypedDict):
    storageId: str

class Objectf6ca76572e97(TypedDict):
    id: str
    name: str
    quantity: float

class Object3cd40e9719f2(TypedDict):
    id: str
    label: str
    type: Literal['SHORT_ANSWER', 'LONG_ANSWER', 'MULTIPLE_CHOICE', 'CHECKBOXES', 'NUMBER', 'DROPDOWN', 'YES_NO']
    required: bool
    options: NotRequired[list[str]]

class Object356518753784(TypedDict):
    name: str
    description: str
    iconName: str
    settings: NotRequired[Object9fdf648cf373]
    sections: list[Object4675ce302d32]
    submitButtonLabel: NotRequired[str]
    onSubmitActions: NotRequired[list[Object6376b80743c1]]
    automations: NotRequired[list[Object01562b3a7fb5]]

class Objectd3056924d246(TypedDict):
    name: str | None
    email: str | None

class Objectf191154d01b8(TypedDict):
    notificationType: Literal['EVENT_EDITED', 'NEW_POST', 'NEW_REPLY', 'DATE_CHOSEN', 'DATE_CHANGED', 'DATE_RESET', 'USER_JOINED', 'USER_LEFT', 'USER_PROMOTED', 'USER_DEMOTED', 'USER_RSVP', 'USER_MENTIONED', 'EVENT_REMINDER', 'FRIEND_REQUEST_RECEIVED', 'FRIEND_REQUEST_ACCEPTED', 'GROUP_INVITE_RECEIVED', 'GROUP_INVITE_ACCEPTED', 'GROUP_MEMBER_REMOVED', 'GROUP_MEMBER_BANNED', 'GROUP_APPLICATION_RECEIVED', 'GROUP_APPLICATION_APPROVED', 'GROUP_APPLICATION_DECLINED', 'GROUP_ANNOUNCEMENT', 'GROUP_ONBOARDING_REQUIRED', 'EVENT_INVITE_RECEIVED', 'EVENT_INVITE_ACCEPTED', 'ADDON_CONFIG_RESET', 'ADDON_AUTOMATION']
    enabled: bool

class Object65bba3d62a1c(TypedDict):
    id: str
    name: str
    email: str

class Objecte86accd2d51f(TypedDict):
    _id: str
    _creationTime: float
    title: str
    description: str | None
    location: str | None
    creatorId: str
    timezone: str
    visibility: Literal['PRIVATE', 'FRIENDS', 'PUBLIC']
    admissionPolicy: Literal['INVITATION_ONLY', 'DIRECT', 'APPLY']
    chosenDateTime: float | None
    chosenEndDateTime: float | None
    imageUrl: str | None
    imageFocalPoint: NotRequired[Object50ef760e0f66]
    createdAt: float
    updatedAt: float
    potentialDateTimeOptions: list[Objectce98b1903941]

class Object5b24a1db1824(TypedDict):
    personId: str
    name: str | None
    username: str | None
    image: str | None

class Objectb9a0c2603865(TypedDict):
    friends: bool
    groups: list[Object8d74f2ccf6a9]

class Object78716c45d186(TypedDict):
    personId: str
    name: str | None
    username: str | None

class Object658127a26002(TypedDict):
    createPosts: Literal['EVERYONE', 'MODERATOR', 'ORGANIZER']
    inviteMembers: Literal['EVERYONE', 'MODERATOR', 'ORGANIZER']
    viewAttendeeList: Literal['EVERYONE', 'MODERATOR', 'ORGANIZER']

class Objectf8ccad6cf3b8(TypedDict):
    createPosts: NotRequired[Literal['EVERYONE', 'MODERATOR', 'ORGANIZER']]
    inviteMembers: NotRequired[Literal['EVERYONE', 'MODERATOR', 'ORGANIZER']]
    viewAttendeeList: NotRequired[Literal['EVERYONE', 'MODERATOR', 'ORGANIZER']]

class Object8d74f2ccf6a9(TypedDict):
    groupId: str
    name: str

class Object83558e3bc551(TypedDict):
    eventId: str
    revision: str
    completed: bool

class Object14927e6acaac(TypedDict):
    email: Literal['not-requested']
    cleanup: Literal['not-requested']

class Object9d78b8568e9e(TypedDict):
    questions: list[Object6a6aeb3276ba]
    reviewerPolicy: Literal['ORGANIZERS_AND_MODERATORS', 'ORGANIZER_ONLY']

class Objectde38060a32b6(TypedDict):
    _id: str
    _creationTime: float
    eventId: str
    personId: str
    questions: list[Object6a6aeb3276ba]
    answers: dict[str, str | float | bool | list[str]]
    status: Literal['PENDING', 'WITHDRAWN', 'APPROVED', 'DECLINED']
    submittedAt: float
    updatedAt: float
    decisions: list[Object6388f0c60c78]

class Object6a6aeb3276ba(TypedDict):
    id: str
    label: str
    required: bool
    type: Literal['SHORT_ANSWER', 'LONG_ANSWER', 'MULTIPLE_CHOICE', 'CHECKBOXES', 'NUMBER', 'DROPDOWN', 'YES_NO']
    options: NotRequired[list[str]]

class Object6388f0c60c78(TypedDict):
    status: Literal['PENDING', 'WITHDRAWN', 'APPROVED', 'DECLINED']
    actorId: NotRequired[str]
    at: float
    reason: NotRequired[str]

class Objecta28dee2fad43(TypedDict):
    personId: str
    name: str | None
    username: str | None
    image: str | None

class Object8fdfc205d0bb(TypedDict):
    x: float
    y: float

class Objectc7f956fcace9(TypedDict):
    id: str
    kind: NotRequired[Literal['user', 'integration']]
    user: Object4e2be9f6831d

class Object8be06601360f(TypedDict):
    id: str
    storageId: str
    filename: str
    size: float
    mimeType: str
    url: str | None

class Object8f4fd078f9a3(TypedDict):
    storageId: str
    filename: str
    size: float
    mimeType: str
    width: NotRequired[float]
    height: NotRequired[float]
    isSpoiler: NotRequired[bool]
    altText: NotRequired[str]

class Object6d5274c5de2d(TypedDict):
    id: str
    label: str

class Object2c98a6bfd5c6(TypedDict):
    eventId: str
    code: str

class Objectb27f127421ba(TypedDict):
    enabled: bool
    requiredCompletion: bool
    requiresCompletion: bool
    canAccessMemberContent: bool
    completed: bool
    shouldPrompt: bool
    version: float

class Object59509cf0ec83(TypedDict):
    id: str
    name: str

class Objecta61bf08328e7(TypedDict):
    enabled: bool
    revision: str
    questions: list[Object6a6aeb3276ba]

class Object5b35bc95b99b(TypedDict):
    role: Literal['OWNER', 'MODERATOR', 'MEMBER']

class Objecta021a3f479e7(TypedDict):
    canApply: bool
    canAccessMemberContent: bool
    banned: bool
    excluded: bool

class Object1c6ddd22f0f6(TypedDict):
    id: str
    status: Literal['PENDING', 'WITHDRAWN', 'APPROVED', 'DECLINED']
    revision: float
    questions: list[Object6a6aeb3276ba]
    answers: dict[str, str | float | bool | list[str]]
    submittedAt: float
    decisions: list[Object1fa6adfb22bd]

class Object068ecbb0d0bb(TypedDict):
    supported: Literal[False]
    subscribed: None

class Object8f7560a6b20e(TypedDict):
    id: str
    title: str
    location: str | None
    description: str | None
    timezone: str
    startsAt: float | None
    endsAt: float | None
    ongoing: bool
    roster: list[Object1e0b443bfaa7] | None

class Object427b94380342(TypedDict):
    membershipId: str
    revision: float
    rsvp: Literal['PENDING', 'YES', 'NO', 'MAYBE']

class Object878ec63794f7(TypedDict):
    applicationId: str
    status: Literal['PENDING', 'WITHDRAWN', 'APPROVED', 'DECLINED']
    revision: float

class Objectcb244cc36b34(TypedDict):
    id: str
    label: str
    required: bool
    type: Literal['SHORT_ANSWER', 'LONG_ANSWER', 'MULTIPLE_CHOICE', 'CHECKBOXES', 'NUMBER', 'DROPDOWN', 'YES_NO']
    options: NotRequired[list[str]]
    version: float

class Objectafe89b003106(TypedDict):
    groupId: str
    name: str
    description: str | None
    image: str | None

class Object17c8fd7ccf8b(TypedDict):
    enabled: bool
    requiredCompletion: bool
    requiresCompletion: bool
    canAccessMemberContent: bool
    version: float
    completed: bool
    shouldPrompt: bool

class Object57afa53f5f81(TypedDict):
    _id: str
    _creationTime: float
    groupId: str
    personId: str
    questions: list[Object6a6aeb3276ba]
    answers: dict[str, str | float | bool | list[str]]
    status: Literal['PENDING', 'WITHDRAWN', 'APPROVED', 'DECLINED']
    submittedAt: float
    updatedAt: float
    decisions: list[Object6388f0c60c78]

class Object7892060edd7e(TypedDict):
    requiredCompletion: bool
    requiresCompletion: bool
    canAccessMemberContent: bool
    enabled: bool
    completed: bool
    shouldPrompt: bool
    version: int

class Object1590d2c92435(TypedDict):
    groupId: str
    name: str
    canWithdraw: bool

class Object5153d73d401b(TypedDict):
    email: str
    recipientName: NotRequired[str]
    plusOnes: NotRequired[int]

class Object9fdf648cf373(TypedDict):
    requiresCompletion: NotRequired[bool]
    supportsOptOut: NotRequired[bool]
    optOutLabel: NotRequired[str]
    cardLinkLabel: NotRequired[str]
    cardSubtitle: NotRequired[str]
    cardOnly: NotRequired[bool]

class Object4675ce302d32(TypedDict):
    id: str
    title: str
    description: NotRequired[str]
    layout: NotRequired[Literal['form', 'interactive']]
    fields: list[Object30a6d58642d2]
    configurable: NotRequired[bool]
    allowedFieldTypes: NotRequired[list[Literal['text', 'number', 'select', 'multiselect', 'yesno', 'list_item', 'vote', 'toggle', 'action_button', 'static_text', 'dynamic_summary', 'divider', 'info_callout']]]
    visibilityConditions: NotRequired[list[Object5b771084f9e7]]

class Object6376b80743c1(TypedDict):
    type: Literal['notify_members', 'notify_organizers', 'notify_submitter', 'create_post', 'update_event_description', 'set_addon_data', 'send_webhook']
    webhookUrl: NotRequired[str]
    webhookHeaders: NotRequired[dict[str, str]]
    message: NotRequired[str]
    title: NotRequired[str]
    key: NotRequired[str]
    data: NotRequired[str | dict[str, str | float | bool | None | list[str]]]
    recipientToggleField: NotRequired[str]

class Object01562b3a7fb5(TypedDict):
    id: str
    name: str
    enabled: bool
    trigger: Objectf13ad84fbfdc
    conditions: list[Object5b771084f9e7]
    actions: list[Object6376b80743c1]

class Object50ef760e0f66(TypedDict):
    x: float
    y: float

class Object4e2be9f6831d(TypedDict):
    id: str
    name: str | None
    email: str | None
    image: str | None
    username: str | None

class Object1fa6adfb22bd(TypedDict):
    status: Literal['PENDING', 'WITHDRAWN', 'APPROVED', 'DECLINED']
    at: float

class Object1e0b443bfaa7(TypedDict):
    displayName: str

class Object30a6d58642d2(TypedDict):
    id: str
    type: Literal['text', 'number', 'select', 'multiselect', 'yesno', 'list_item', 'vote', 'toggle', 'action_button', 'static_text', 'dynamic_summary', 'divider', 'info_callout']
    label: NotRequired[str]
    required: bool
    configurable: NotRequired[bool]
    variant: NotRequired[Literal['short', 'long']]
    placeholder: NotRequired[str]
    maxLength: NotRequired[int]
    min: NotRequired[float]
    max: NotRequired[float]
    options: NotRequired[list[str]]
    minSelections: NotRequired[int]
    maxSelections: NotRequired[int]
    items: NotRequired[list[Object020897d2fabb]]
    allowMultiple: NotRequired[bool]
    showResults: NotRequired[bool]
    content: NotRequired[str]
    textFormat: NotRequired[Literal['p', 'h1', 'h2', 'h3']]
    summaryType: NotRequired[Literal['response_count', 'vote_leader', 'signup_progress', 'custom_text']]
    summaryLabel: NotRequired[str]
    dividerLabel: NotRequired[str]
    calloutVariant: NotRequired[Literal['info', 'warning', 'success']]
    calloutMessage: NotRequired[str]
    buttonLabel: NotRequired[str]
    buttonVariant: NotRequired[Literal['default', 'secondary', 'outline', 'destructive']]
    defaultEnabled: NotRequired[bool]
    actions: NotRequired[list[Object6376b80743c1]]
    visibilityConditions: NotRequired[list[Object5b771084f9e7]]

class Object5b771084f9e7(TypedDict):
    field: str
    operator: Literal['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'greater_or_equal', 'less_or_equal', 'is_empty', 'is_not_empty', 'in_list', 'not_in_list']
    value: NotRequired[str | float | bool | None | list[str]]

class Objectf13ad84fbfdc(TypedDict):
    type: Literal['form_submitted', 'list_item_claimed', 'list_item_full', 'vote_cast', 'vote_threshold', 'toggle_changed', 'all_responses_in', 'member_joined', 'member_left', 'date_chosen', 'addon_enabled']
    fieldId: NotRequired[str]
    threshold: NotRequired[int]

class Object020897d2fabb(TypedDict):
    id: str
    name: str
    quantity: int

EventListResponse: TypeAlias = list[EventSummary]

MemberListResponse: TypeAlias = list[Object4add9dfd0c54]

PotentialDatesResponse: TypeAlias = list[PotentialDateTime]

FriendListResponse: TypeAlias = list[FriendSummary]

FriendRequestListResponse: TypeAlias = list[FriendRequest]

UserSearchResponse: TypeAlias = list[UserSearchResult]

AddonListResponse: TypeAlias = list[AddonConfig]

AddonDataListResponse: TypeAlias = list[AddonDataEntry]

NotificationListResponse: TypeAlias = list[Notification]

CustomThemeListResponse: TypeAlias = list[CustomTheme]

InviteListDetail: TypeAlias = Objectf0baf57f0dd1

SelectableInviteListPerson: TypeAlias = Object4e7204ad5011

AdminUserListResponse: TypeAlias = list[AdminUserSummary]

AdminEventListResponse: TypeAlias = list[AdminEventSummary]

AdminReportListResponse: TypeAlias = list[ReportSummary]
