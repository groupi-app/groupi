from typing import AsyncIterator, Iterator, Literal, NotRequired, TypedDict, Protocol

class DelegatedToken(TypedDict):
    access_token: str
    instance: str
    audience: str
    expires_at: NotRequired[float]

class TokenProvider(Protocol):
    def __call__(self, *, instance: str, audience: str) -> DelegatedToken: ...

class ErrorResponse(TypedDict):
    error: Object3f70f6db216f

EventListResponse = list[EventSummary]
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

MemberListResponse = list[Object4add9dfd0c54]
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

PotentialDatesResponse = list[PotentialDateTime]
FriendListResponse = list[FriendSummary]
class FriendSummary(TypedDict):
    friendshipId: str
    personId: str
    userId: str
    name: str | None
    username: str | None
    image: str | None
    lastSeen: int | None

FriendRequestListResponse = list[FriendRequest]
class FriendRequest(TypedDict):
    friendshipId: str
    personId: str
    userId: str
    name: str | None
    username: str | None
    image: str | None
    createdAt: int

UserSearchResponse = list[UserSearchResult]
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

AddonListResponse = list[AddonConfig]
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

AddonDataListResponse = list[AddonDataEntry]
class AddonDataEntry(TypedDict):
    id: str
    key: str
    data: str | dict[str, str | float | bool | None | list[str]]
    createdBy: str | None
    createdAt: int
    updatedAt: int

class SetAddonDataRequest(TypedDict):
    data: dict[str, str | float | bool | None | list[str]]

NotificationListResponse = list[Notification]
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

CustomThemeListResponse = list[CustomTheme]
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

InviteListDetail = Objectf0baf57f0dd1
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

SelectableInviteListPerson = Object4e7204ad5011
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

AdminUserListResponse = list[AdminUserSummary]
class AdminUserSummary(TypedDict):
    userId: str
    user: UserSummary
    person: Object35e7b1a54aee | None
    createdAt: int

class SetUserRoleRequest(TypedDict):
    role: Literal['user', 'admin']

AdminEventListResponse = list[AdminEventSummary]
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

AdminReportListResponse = list[ReportSummary]
class ReportSummary(TypedDict):
    id: str
    reporterId: str
    targetType: Literal['USER', 'EVENT', 'POST', 'REPLY']
    targetId: str
    reason: Literal['SPAM', 'HARASSMENT', 'HATE_SPEECH', 'INAPPROPRIATE_CONTENT', 'IMPERSONATION', 'OTHER']
    details: str | None
    status: Literal['PENDING', 'DISMISSED', 'ACTION_TAKEN']
    createdAt: int


class Groupi:
    def __init__(self, *, instance: str, api_key: str | None = ..., bounded_api_key: str | None = ..., token_provider: TokenProvider | None = ..., audience: str | None = ..., retries: int = ..., timeout: float = ..., max_response_bytes: int = ...) -> None: ...
    def upload(self, data: bytes, *, filename: str, mime_type: str = ..., purpose: Literal['attachment', 'avatar', 'cover'] = ..., event_id: str | None = ...) -> dict[str, object]: ...
    def discard_upload(self, storage_id: str) -> None: ...
    def health(self) -> dict[str, object]: ...
    def require_capability(self, name: str, version: int = ...) -> dict[str, object]: ...
    def iterate_events(self, *, limit: int = ..., max_pages: int = ...) -> Iterator[EventSummary]: ...
    def get_account_responsibilities(self, *, path: None | None = ..., query: Objectffbe1c9950c8, body: None | None = ..., idempotency_key: str | None = ...) -> Objecta6ae99ae07d4: ...
    def get_account_responsibilities_items(self, *, path: None | None = ..., query: Objectffbe1c9950c8, max_pages: int = ...) -> Iterator[Object946aea546666]: ...
    def read_live_readiness_final_deletion_revalidates(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object6660c3839c76: ...
    def post_account_delete(self, *, path: None | None = ..., query: None | None = ..., body: Object2af7fe0f9b46, idempotency_key: str | None = ...) -> Object2d05ad4bdae6: ...
    def delete_account_responsibilities_events(self, *, path: Object0af774823b7d, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    def post_auth_cli_exchange(self, *, path: None | None = ..., query: None | None = ..., body: Objecte5faf1f089f2, idempotency_key: str | None = ...) -> Object49bf06d9c16f: ...
    def post_auth_cli_revoke(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object5964056f794d: ...
    def inspect_consensual_ownership_transfer(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object8ffbbe5fe6b2 | None: ...
    def offer_ownership_to_an_eligible_existing_member(self, *, path: Object63660964c4c7, query: None | None = ..., body: Object0c3e8abbf5ca, idempotency_key: str | None = ...) -> Object8ffbbe5fe6b2 | None: ...
    def accept_the_named_ownership_offer(self, *, path: Object63660964c4c7, query: None | None = ..., body: Object85dd26cb8024, idempotency_key: str | None = ...) -> Object8ffbbe5fe6b2 | None: ...
    def decline_the_named_ownership_offer(self, *, path: Object63660964c4c7, query: None | None = ..., body: Object85dd26cb8024, idempotency_key: str | None = ...) -> Object8ffbbe5fe6b2 | None: ...
    def cancel_the_named_ownership_offer(self, *, path: Object63660964c4c7, query: None | None = ..., body: Object85dd26cb8024, idempotency_key: str | None = ...) -> Object8ffbbe5fe6b2 | None: ...
    def read_viewer_safe_event_logistics_before_joining(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object9e90c2c3d1a5: ...
    def discover_friends_and_group_events(self, *, path: None | None = ..., query: Objectf0fd2ef7e5a4 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object4a648d6fd5f5: ...
    def discover_friends_and_group_events_items(self, *, path: None | None = ..., query: Objectf0fd2ef7e5a4 | None = ..., max_pages: int = ...) -> Iterator[Object6bb7463cee3b]: ...
    def join_a_discoverable_event(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object1d3bbf168039: ...
    def read_event_visibility_admission_and_permissions(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objecte5a809dc5829: ...
    def update_event_visibility_admission_and_permissions(self, *, path: Object63660964c4c7, query: None | None = ..., body: Objectddbcd2fd4c82, idempotency_key: str | None = ...) -> Objecte5a809dc5829: ...
    def get_events_event_id_applications_form(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objected2365fc2ed6: ...
    def get_events_event_id_applications_history(self, *, path: Object63660964c4c7, query: Object7e06335c5475 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectb366528fe427: ...
    def get_events_event_id_applications_history_items(self, *, path: Object63660964c4c7, query: Object7e06335c5475 | None = ..., max_pages: int = ...) -> Iterator[Objecta6e648a4652b]: ...
    def get_events_event_id_applications_list(self, *, path: Object63660964c4c7, query: Object7e06335c5475 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object9607a2178a0e: ...
    def get_events_event_id_applications_list_items(self, *, path: Object63660964c4c7, query: Object7e06335c5475 | None = ..., max_pages: int = ...) -> Iterator[Object0597d5e84f7c]: ...
    def put_events_event_id_applications_settings(self, *, path: Object63660964c4c7, query: None | None = ..., body: Object85f20860c120, idempotency_key: str | None = ...) -> Object85f20860c120: ...
    def post_events_event_id_applications(self, *, path: Object63660964c4c7, query: None | None = ..., body: Objectec2c97973b61, idempotency_key: str | None = ...) -> Object8dc03c71a240: ...
    def post_event_applications_application_id_withdraw(self, *, path: Object715b53dc68f5, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object8dc03c71a240: ...
    def post_event_applications_application_id_decision(self, *, path: Object715b53dc68f5, query: None | None = ..., body: Object04868a1f6ada, idempotency_key: str | None = ...) -> Object8dc03c71a240: ...
    def list_events(self, *, path: None | None = ..., query: Objectf0fd2ef7e5a4 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> EventListResponse | EventPageResponse: ...
    def list_events_items(self, *, path: None | None = ..., query: Objectf0fd2ef7e5a4 | None = ..., max_pages: int = ...) -> Iterator[EventSummary]: ...
    def create_event(self, *, path: None | None = ..., query: None | None = ..., body: CreateEventRequest, idempotency_key: str | None = ...) -> EventCreateResponse: ...
    def get_event(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> EventDetail: ...
    def update_event(self, *, path: Object63660964c4c7, query: None | None = ..., body: UpdateEventRequest, idempotency_key: str | None = ...) -> EventDetail | Objectad794210902b: ...
    def delete_event(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    def inspect_current_account_avatar(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object0b4baf2fc1af: ...
    def replace_current_account_avatar(self, *, path: None | None = ..., query: None | None = ..., body: Object82edc32e8e2d, idempotency_key: str | None = ...) -> Object0b4baf2fc1af: ...
    def remove_current_account_avatar(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object0b4baf2fc1af: ...
    def inspect_event_cover(self, *, path: Object2a37f36fe967, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object0b4baf2fc1af: ...
    def replace_event_cover(self, *, path: Object2a37f36fe967, query: None | None = ..., body: Object8f2e07428f60, idempotency_key: str | None = ...) -> Object0b4baf2fc1af: ...
    def remove_event_cover(self, *, path: Object2a37f36fe967, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object0b4baf2fc1af: ...
    def list_posts(self, *, path: Object7b041e5fec41, query: Object6cdac6024129 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> list[Objectaf5c4bdda5d7] | Object87783cbc6404: ...
    def list_posts_items(self, *, path: Object7b041e5fec41, query: Object6cdac6024129 | None = ..., max_pages: int = ...) -> Iterator[Objectaf5c4bdda5d7]: ...
    def get_post(self, *, path: Object34ab70d01c28, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectbd43ca3d5411: ...
    def update_post(self, *, path: Object34ab70d01c28, query: None | None = ..., body: Objecte63be612b92f, idempotency_key: str | None = ...) -> Objectbd43ca3d5411 | Object60ee9f02bc5d: ...
    def delete_post(self, *, path: Object34ab70d01c28, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    def create_post(self, *, path: Object34ab70d01c28, query: None | None = ..., body: Objecte63be612b92f, idempotency_key: str | None = ...) -> Object60ee9f02bc5d: ...
    def list_replies(self, *, path: Object7b041e5fec41, query: Object6cdac6024129 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> list[Object009017a89888] | Objectfda4f2d5c7e6: ...
    def list_replies_items(self, *, path: Object7b041e5fec41, query: Object6cdac6024129 | None = ..., max_pages: int = ...) -> Iterator[Object009017a89888]: ...
    def get_reply(self, *, path: Object34ab70d01c28, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object009017a89888: ...
    def update_reply(self, *, path: Object34ab70d01c28, query: None | None = ..., body: Objecte63be612b92f, idempotency_key: str | None = ...) -> Object009017a89888 | Object588b21707c8f: ...
    def delete_reply(self, *, path: Object34ab70d01c28, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    def create_reply(self, *, path: Object34ab70d01c28, query: None | None = ..., body: Objecte63be612b92f, idempotency_key: str | None = ...) -> Object588b21707c8f: ...
    def list_members(self, *, path: Object63660964c4c7, query: Objectf0fd2ef7e5a4 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> MemberListResponse | Object3dd5d2118ecf: ...
    def list_members_items(self, *, path: Object63660964c4c7, query: Objectf0fd2ef7e5a4 | None = ..., max_pages: int = ...) -> Iterator[Object4add9dfd0c54]: ...
    def update_member_role(self, *, path: Object0a5f5ed92c94, query: None | None = ..., body: UpdateMemberRoleRequest, idempotency_key: str | None = ...) -> MemberDetail: ...
    def remove_member(self, *, path: Object0a5f5ed92c94, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    def leave_event(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> MessageResponse: ...
    def update_r_s_v_p(self, *, path: Object63660964c4c7, query: None | None = ..., body: UpdateRsvpRequest, idempotency_key: str | None = ...) -> RsvpUpdateResponse: ...
    def read_your_r_s_v_p(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> RsvpUpdateResponse: ...
    def read_availability_grid(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> AvailabilityGridResponse: ...
    def submit_availability(self, *, path: Object63660964c4c7, query: None | None = ..., body: SubmitAvailabilityRequest, idempotency_key: str | None = ...) -> SubmitAvailabilityResponse: ...
    def clear_your_availability(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object1e88c8173d97: ...
    def list_potential_dates(self, *, path: Object63660964c4c7, query: Objectf0fd2ef7e5a4 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> PotentialDatesResponse | Object248fc0ec5484: ...
    def list_potential_dates_items(self, *, path: Object63660964c4c7, query: Objectf0fd2ef7e5a4 | None = ..., max_pages: int = ...) -> Iterator[PotentialDateTime]: ...
    def read_your_availability(self, *, path: Object63660964c4c7, query: Objectf0fd2ef7e5a4 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object8cd0cdf0cfec: ...
    def read_your_availability_items(self, *, path: Object63660964c4c7, query: Objectf0fd2ef7e5a4 | None = ..., max_pages: int = ...) -> Iterator[Objectc503c7ffa279]: ...
    def list_availability_responses(self, *, path: Object63660964c4c7, query: Object5e8548e1584c, body: None | None = ..., idempotency_key: str | None = ...) -> Objecte06d7904516b: ...
    def list_availability_responses_items(self, *, path: Object63660964c4c7, query: Object5e8548e1584c, max_pages: int = ...) -> Iterator[Object59affbc4fdba]: ...
    def choose_event_date(self, *, path: Object63660964c4c7, query: None | None = ..., body: Object83d893372472 | Object3e2b6d8f36c1, idempotency_key: str | None = ...) -> EventDetail: ...
    def reset_event_date(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> EventDetail: ...
    def list_friends(self, *, path: None | None = ..., query: Objectee0c1fb649a9 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> FriendListResponse | Object0b76429c8b74: ...
    def list_friends_items(self, *, path: None | None = ..., query: Objectee0c1fb649a9 | None = ..., max_pages: int = ...) -> Iterator[FriendSummary]: ...
    def list_incoming_requests(self, *, path: None | None = ..., query: Objectee0c1fb649a9 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> FriendRequestListResponse | Object8bfb6348dae9: ...
    def list_incoming_requests_items(self, *, path: None | None = ..., query: Objectee0c1fb649a9 | None = ..., max_pages: int = ...) -> Iterator[FriendRequest]: ...
    def list_outgoing_requests(self, *, path: None | None = ..., query: Objectee0c1fb649a9 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> FriendRequestListResponse | Object8bfb6348dae9: ...
    def list_outgoing_requests_items(self, *, path: None | None = ..., query: Objectee0c1fb649a9 | None = ..., max_pages: int = ...) -> Iterator[FriendRequest]: ...
    def search_users(self, *, path: None | None = ..., query: Objectb63cbd7183d3, body: None | None = ..., idempotency_key: str | None = ...) -> UserSearchResponse: ...
    def get_friendship_status(self, *, path: Object448825efceb1, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> FriendshipStatusResponse: ...
    def send_friend_request(self, *, path: None | None = ..., query: None | None = ..., body: SendFriendRequest, idempotency_key: str | None = ...) -> FriendRequestResponse: ...
    def accept_friend_request(self, *, path: Object96dfba5d30b4, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> MessageResponse: ...
    def decline_friend_request(self, *, path: Object96dfba5d30b4, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> MessageResponse: ...
    def cancel_friend_request(self, *, path: Object96dfba5d30b4, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    def remove_friend(self, *, path: Object96dfba5d30b4, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    def explicitly_announce_to_permitted_group_members(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object5652b722bc8e, idempotency_key: str | None = ...) -> Object07b930802b31: ...
    def recover_your_explicit_announcement_request_status(self, *, path: Objectc3f4431a1c67, query: Object5d2a59b99424, body: None | None = ..., idempotency_key: str | None = ...) -> Objectb99f1ac5dcce | None: ...
    def list_persistent_group_lists(self, *, path: Objectc3f4431a1c67, query: Objectabcad7a92e35 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object321903aa80bf: ...
    def list_persistent_group_lists_items(self, *, path: Objectc3f4431a1c67, query: Objectabcad7a92e35 | None = ..., max_pages: int = ...) -> Iterator[Objectb49cb191869a]: ...
    def create_persistent_group_list(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object8f955e380d70, idempotency_key: str | None = ...) -> Object003f9ced057a: ...
    def get_persistent_group_lists(self, *, path: Objectadc1f508905f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object1714fdefbeb4: ...
    def configure_persistent_group_list(self, *, path: Objectadc1f508905f, query: None | None = ..., body: Objecte9e2a0e737a4, idempotency_key: str | None = ...) -> None: ...
    def remove_persistent_group_list(self, *, path: Objectadc1f508905f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    def settings_persistent_group_lists(self, *, path: Objectadc1f508905f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object1714fdefbeb4: ...
    def entries_persistent_group_lists(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object0e150b4bfa9f: ...
    def entries_persistent_group_lists_items(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., max_pages: int = ...) -> Iterator[Object32cc511c23d6]: ...
    def add_persistent_group_list(self, *, path: Objectadc1f508905f, query: None | None = ..., body: Objectc9c73e6f1496, idempotency_key: str | None = ...) -> Object2e89b7d741b1: ...
    def own_persistent_group_lists(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object0e150b4bfa9f: ...
    def own_persistent_group_lists_items(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., max_pages: int = ...) -> Iterator[Object32cc511c23d6]: ...
    def edit_persistent_group_list(self, *, path: Object2ef4e0f19715, query: None | None = ..., body: Objectcc99fe557380, idempotency_key: str | None = ...) -> Objectaa456dc0873a: ...
    def removeentry_persistent_group_list(self, *, path: Object2ef4e0f19715, query: None | None = ..., body: Objectef1fffec8cbc, idempotency_key: str | None = ...) -> None: ...
    def read_owner_list_availability_and_creation_policy(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object98f4cc8bd3c7: ...
    def owner_configures_list_availability_and_creation(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object53a746cb1440, idempotency_key: str | None = ...) -> Object2d05ad4bdae6: ...
    def create_an_independent_persistent_ordinary_form(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Objectd2897b45c533, idempotency_key: str | None = ...) -> Object003f9ced057a: ...
    def list_ordinary_forms_independently_of_the_joining_questionnaire(self, *, path: Objectc3f4431a1c67, query: Objectabcad7a92e35 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object321903aa80bf: ...
    def list_ordinary_forms_independently_of_the_joining_questionnaire_items(self, *, path: Objectc3f4431a1c67, query: Objectabcad7a92e35 | None = ..., max_pages: int = ...) -> Iterator[Objectb49cb191869a]: ...
    def get_groups_forms_settings(self, *, path: Objectadc1f508905f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object8b0b6b6d7659: ...
    def read_current_form_and_your_compatible_answers(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectda991d1da7bb: ...
    def patch_groups_forms(self, *, path: Objectadc1f508905f, query: None | None = ..., body: Object9afc4a5afed9, idempotency_key: str | None = ...) -> None: ...
    def explicitly_delete_form_and_all_responses(self, *, path: Objectadc1f508905f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    def read_only_your_retained_response_snapshots(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object8195a916a385: ...
    def read_only_your_retained_response_snapshots_items(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., max_pages: int = ...) -> Iterator[Objectbe3c37f1eb4e]: ...
    def read_stated_visibility_latest_responses(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object8195a916a385: ...
    def read_stated_visibility_latest_responses_items(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., max_pages: int = ...) -> Iterator[Objectbe3c37f1eb4e]: ...
    def put_groups_forms_response(self, *, path: Objectadc1f508905f, query: None | None = ..., body: Objectcffe1fccdcde, idempotency_key: str | None = ...) -> Object5db5384852d1: ...
    def remove_your_response_and_private_retained_history(self, *, path: Objectadc1f508905f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    def delete_groups_forms_results(self, *, path: Objectfb48a02fd4cf, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    def read_form_availability_creation_policy(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object632de87bce2f: ...
    def owner_controls_form_availability_and_creation(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object53a746cb1440, idempotency_key: str | None = ...) -> Object2d05ad4bdae6: ...
    def create_an_independent_persistent_persistent_poll(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object2072a1ae5071, idempotency_key: str | None = ...) -> Object003f9ced057a: ...
    def get_groups_polls(self, *, path: Objectc3f4431a1c67, query: Objectabcad7a92e35 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object321903aa80bf: ...
    def get_groups_polls_items(self, *, path: Objectc3f4431a1c67, query: Objectabcad7a92e35 | None = ..., max_pages: int = ...) -> Iterator[Objectb49cb191869a]: ...
    def get_groups_polls_settings(self, *, path: Objectadc1f508905f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectfd00f8f95b46: ...
    def read_current_poll_and_your_compatible_selections(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object1cf48926007e: ...
    def patch_groups_polls(self, *, path: Objectadc1f508905f, query: None | None = ..., body: Object800bf512e4e2, idempotency_key: str | None = ...) -> None: ...
    def delete_a_poll_and_all_votes_as_a_current_eligible_manager(self, *, path: Objectadc1f508905f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    def read_only_your_retained_vote_snapshots(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object6f22d6521161: ...
    def read_only_your_retained_vote_snapshots_items(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., max_pages: int = ...) -> Iterator[Objectd968e063c948]: ...
    def read_stated_visibility_latest_votes(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object1e55c0550d05: ...
    def read_stated_visibility_latest_votes_items(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., max_pages: int = ...) -> Iterator[Object430f2d180bd9]: ...
    def put_groups_polls_vote(self, *, path: Objectadc1f508905f, query: None | None = ..., body: Object29c0167f9b1d, idempotency_key: str | None = ...) -> Object5db5384852d1: ...
    def remove_your_vote_and_private_history_using_optimistic_revision(self, *, path: Objectadc1f508905f, query: None | None = ..., body: Object8c477699d177, idempotency_key: str | None = ...) -> None: ...
    def delete_groups_polls_results(self, *, path: Objectb17b74c18a8f, query: None | None = ..., body: Object8c477699d177, idempotency_key: str | None = ...) -> None: ...
    def read_poll_availability_creation_policy(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object67ea0bf089d7: ...
    def owner_controls_poll_availability_and_creation(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object53a746cb1440, idempotency_key: str | None = ...) -> Object2d05ad4bdae6: ...
    def list_your_groups(self, *, path: None | None = ..., query: Object96110c08a73a | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object598737a2dca1: ...
    def list_your_groups_items(self, *, path: None | None = ..., query: Object96110c08a73a | None = ..., max_pages: int = ...) -> Iterator[Objectb7fb19a40d96]: ...
    def create_an_owner_only_group(self, *, path: None | None = ..., query: None | None = ..., body: Objectfa3a9e641148, idempotency_key: str | None = ...) -> Object38a2ce79b0f1: ...
    def read_an_admitted_group(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectb7fb19a40d96: ...
    def update_group_identity_as_owner(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Objectf2a3cfe95492, idempotency_key: str | None = ...) -> None: ...
    def explicitly_delete_a_group_as_owner(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    def read_own_community_context(self, *, path: Objectc3f4431a1c67, query: Objecta2791daed18f | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectf8c3bec6a790: ...
    def submit_community_application(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Objecte4ea0c62ce41, idempotency_key: str | None = ...) -> Object53e85f30308a: ...
    def edit_community_application(self, *, path: Object0210d908b1ed, query: None | None = ..., body: Objectece999219204, idempotency_key: str | None = ...) -> Object53e85f30308a: ...
    def withdraw_community_application(self, *, path: Object0210d908b1ed, query: None | None = ..., body: Object8c477699d177, idempotency_key: str | None = ...) -> Object53e85f30308a: ...
    def get_groups_joining_questionnaire(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object056f6599a34c: ...
    def put_groups_joining_questionnaire(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object624371b3aebe, idempotency_key: str | None = ...) -> Object056f6599a34c: ...
    def submit_or_edit_private_answers_as_an_admitted_member(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object6395deb0e4ba, idempotency_key: str | None = ...) -> Object056f6599a34c: ...
    def review_private_answers_as_current_owner_or_moderator(self, *, path: Objectc3f4431a1c67, query: Object96110c08a73a | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object61969d67aaba: ...
    def review_private_answers_as_current_owner_or_moderator_items(self, *, path: Objectc3f4431a1c67, query: Object96110c08a73a | None = ..., max_pages: int = ...) -> Iterator[Object3cee5d7a2d66]: ...
    def get_groups_joining_questionnaire_history(self, *, path: Objectc3f4431a1c67, query: Object1611008fb05a | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object97987385f170: ...
    def get_groups_joining_questionnaire_history_items(self, *, path: Objectc3f4431a1c67, query: Object1611008fb05a | None = ..., max_pages: int = ...) -> Iterator[Objectb31c8114c447]: ...
    def list_your_private_group_invitations(self, *, path: None | None = ..., query: Object24f61c89eae7 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object1357fe91c2ec: ...
    def list_your_private_group_invitations_items(self, *, path: None | None = ..., query: Object24f61c89eae7 | None = ..., max_pages: int = ...) -> Iterator[Object478f41967623]: ...
    def list_group_invitations_as_manager(self, *, path: Objectc3f4431a1c67, query: Object24f61c89eae7 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object1357fe91c2ec: ...
    def list_group_invitations_as_manager_items(self, *, path: Objectc3f4431a1c67, query: Object24f61c89eae7 | None = ..., max_pages: int = ...) -> Iterator[Object478f41967623]: ...
    def invite_an_existing_user_as_group_owner(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object3ec0572a6d9e, idempotency_key: str | None = ...) -> Objectd246a5fb6d0b: ...
    def read_admitted_group_roster(self, *, path: Objectc3f4431a1c67, query: Object96110c08a73a | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objecte1c0fcf8b40a: ...
    def read_admitted_group_roster_items(self, *, path: Objectc3f4431a1c67, query: Object96110c08a73a | None = ..., max_pages: int = ...) -> Iterator[Object7514791d9a3f]: ...
    def configure_group_invitations_as_owner(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object64c44083196e, idempotency_key: str | None = ...) -> None: ...
    def accept_your_group_invitation(self, *, path: Object7c5e30947e1c, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objecte0128353cd2d: ...
    def decline_your_group_invitation(self, *, path: Object7c5e30947e1c, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objecte375ea6b235c: ...
    def cancel_a_pending_invitation_as_group_manager(self, *, path: Object7c5e30947e1c, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objecte375ea6b235c: ...
    def list_active_group_bans_as_manager(self, *, path: Objectc3f4431a1c67, query: Object96110c08a73a | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object35141a46d0a7: ...
    def list_active_group_bans_as_manager_items(self, *, path: Objectc3f4431a1c67, query: Object96110c08a73a | None = ..., max_pages: int = ...) -> Iterator[Object1e56fe7dd0b1]: ...
    def appoint_or_demote_a_group_moderator_as_owner(self, *, path: Object80d270ff2592, query: None | None = ..., body: Object48e20440b294, idempotency_key: str | None = ...) -> Objectbd478dc0c377: ...
    def remove_an_ordinary_member_without_banning(self, *, path: Object80d270ff2592, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectdd6a39aba87a: ...
    def ban_an_ordinary_member_or_nonmember(self, *, path: Object80d270ff2592, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object8bf4b7cfb096: ...
    def lift_a_group_ban_without_admitting_membership(self, *, path: Object80d270ff2592, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object8bf4b7cfb096: ...
    def leave_your_own_group_membership(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object80c0f0a1db81: ...
    def read_private_participant_ownership_offer_status(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object20854cd7c77a | None: ...
    def offer_group_responsibility_to_an_admitted_member(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object5209c9e060c4, idempotency_key: str | None = ...) -> Object20854cd7c77a | None: ...
    def accept_the_observed_ownership_offer(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object888d9185a767, idempotency_key: str | None = ...) -> Object20854cd7c77a | None: ...
    def decline_the_observed_ownership_offer(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object888d9185a767, idempotency_key: str | None = ...) -> Object20854cd7c77a | None: ...
    def cancel_the_observed_ownership_offer(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object888d9185a767, idempotency_key: str | None = ...) -> Object20854cd7c77a | None: ...
    def read_admission_questions_and_your_private_pending_application(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object7ba2960d50b6: ...
    def configure_group_applications_as_owner(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Objecta66ce69c5289, idempotency_key: str | None = ...) -> Object8798ded7869a: ...
    def read_your_retained_private_group_application_history(self, *, path: Objectc3f4431a1c67, query: Object96110c08a73a | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectcf0d5ee44ad5: ...
    def read_your_retained_private_group_application_history_items(self, *, path: Objectc3f4431a1c67, query: Object96110c08a73a | None = ..., max_pages: int = ...) -> Iterator[Objectf006a1c397a2]: ...
    def review_private_group_application_queue_as_manager(self, *, path: Objectc3f4431a1c67, query: Objecta91b1c668b6a | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectc3c66273bb38: ...
    def review_private_group_application_queue_as_manager_items(self, *, path: Objectc3f4431a1c67, query: Objecta91b1c668b6a | None = ..., max_pages: int = ...) -> Iterator[Object84c39b4ad201]: ...
    def submit_or_edit_your_pending_admission_application(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Objectb4f84fb246b8, idempotency_key: str | None = ...) -> Object4f75c6f32bec: ...
    def read_a_private_application_as_its_author_or_current_manager(self, *, path: Object1536187ddb0f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectf006a1c397a2: ...
    def edit_your_pending_answers_against_saved_question_definitions(self, *, path: Object1536187ddb0f, query: None | None = ..., body: Object400d4467dcf9, idempotency_key: str | None = ...) -> Object4f75c6f32bec: ...
    def withdraw_your_pending_application_without_deleting_history(self, *, path: Object1536187ddb0f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object4f75c6f32bec: ...
    def approve_or_decline_an_application_as_current_group_manager(self, *, path: Object1536187ddb0f, query: None | None = ..., body: Object026c1c76bdd8, idempotency_key: str | None = ...) -> Object4f75c6f32bec: ...
    def get_events_audiences(self, *, path: Object0af774823b7d, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object6ca3b0de678c: ...
    def set_independent_friends_audience_as_current_organizer(self, *, path: Object0af774823b7d, query: None | None = ..., body: Objectbc8e85e56367, idempotency_key: str | None = ...) -> Object392afdf5c5c2: ...
    def configure_whole_group_event_sharing_as_owner(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object6e16a7e029f2, idempotency_key: str | None = ...) -> Object8798ded7869a: ...
    def share_with_a_whole_group_with_both_permissions(self, *, path: Object507f8507399f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object4a2b5fd38217: ...
    def withdraw_one_group_grant_without_affecting_other_audiences(self, *, path: Object507f8507399f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object4a2b5fd38217: ...
    def delete_groups_events(self, *, path: Object507f8507399f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object4a2b5fd38217: ...
    def get_groups_events(self, *, path: Objectc3f4431a1c67, query: Object96110c08a73a | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object9f4b613046fe: ...
    def get_groups_events_items(self, *, path: Objectc3f4431a1c67, query: Object96110c08a73a | None = ..., max_pages: int = ...) -> Iterator[Object7b5e95a37930]: ...
    def list_blocked_users_bounded_cursor_pages(self, *, path: None | None = ..., query: Objectee0c1fb649a9 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object476a5720ad4f: ...
    def list_blocked_users_bounded_cursor_pages_items(self, *, path: None | None = ..., query: Objectee0c1fb649a9 | None = ..., max_pages: int = ...) -> Iterator[Object90355adbcd73]: ...
    def inspect_block_relationship(self, *, path: Object49e7860ab2a6, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object806772894c12: ...
    def block_user_and_remove_friendships_requests(self, *, path: Object49e7860ab2a6, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> MessageResponse: ...
    def unblock_user(self, *, path: Object49e7860ab2a6, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    def list_your_existing_published_custom_templates(self, *, path: None | None = ..., query: Object82f2072d92bc | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> list[Object6ec7a36191ae] | Object4dc45c542b89: ...
    def list_your_existing_published_custom_templates_items(self, *, path: None | None = ..., query: Object82f2072d92bc | None = ..., max_pages: int = ...) -> Iterator[Object6ec7a36191ae]: ...
    def post_events_addons_participation(self, *, path: Object4a8443ff6a1a, query: None | None = ..., body: Object0db44385f557, idempotency_key: str | None = ...) -> Object2d05ad4bdae6 | Objectb5ab3e5b460c | Object556f4f3df304: ...
    def list_add_ons(self, *, path: Object63660964c4c7, query: Object82f2072d92bc | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> AddonListResponse | Object812fae11d33a: ...
    def list_add_ons_items(self, *, path: Object63660964c4c7, query: Object82f2072d92bc | None = ..., max_pages: int = ...) -> Iterator[AddonConfig]: ...
    def enable_add_on(self, *, path: Object4a8443ff6a1a, query: None | None = ..., body: EnableAddonRequest, idempotency_key: str | None = ...) -> MessageResponse: ...
    def disable_add_on(self, *, path: Object4a8443ff6a1a, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> MessageResponse: ...
    def update_add_on_config(self, *, path: Object4a8443ff6a1a, query: None | None = ..., body: UpdateAddonConfigRequest, idempotency_key: str | None = ...) -> AddonConfig: ...
    def list_add_on_data(self, *, path: Object4a8443ff6a1a, query: Object82f2072d92bc | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> AddonDataListResponse | Objectb418e20abe35: ...
    def list_add_on_data_items(self, *, path: Object4a8443ff6a1a, query: Object82f2072d92bc | None = ..., max_pages: int = ...) -> Iterator[AddonDataEntry]: ...
    def set_add_on_data(self, *, path: Object9c4e853d82c3, query: None | None = ..., body: SetAddonDataRequest, idempotency_key: str | None = ...) -> AddonDataEntry: ...
    def delete_add_on_data(self, *, path: Object9c4e853d82c3, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    def list_owned_draft_and_published_definitions(self, *, path: None | None = ..., query: Object032a0f41ed85 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object04b6a50da866: ...
    def list_owned_draft_and_published_definitions_items(self, *, path: None | None = ..., query: Object032a0f41ed85 | None = ..., max_pages: int = ...) -> Iterator[Objectc05dd86f8b46]: ...
    def create_a_complete_definition_as_a_draft(self, *, path: None | None = ..., query: None | None = ..., body: Object7d2b597814a5, idempotency_key: str | None = ...) -> Objectc05dd86f8b46: ...
    def read_an_owned_definition(self, *, path: Objectc6fb40ac8b06, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectc05dd86f8b46: ...
    def replace_an_owned_definition_at_the_expected_version(self, *, path: Objectc6fb40ac8b06, query: None | None = ..., body: Objectb56ae94c0c8e, idempotency_key: str | None = ...) -> Objectc05dd86f8b46: ...
    def delete_addon_template_definitions(self, *, path: Objectc6fb40ac8b06, query: Objectda9a27f0c6c6, body: None | None = ..., idempotency_key: str | None = ...) -> Object36f05472f96c: ...
    def publish_an_owned_definition(self, *, path: Objectc6fb40ac8b06, query: None | None = ..., body: Objectca34d7164571, idempotency_key: str | None = ...) -> Objectc05dd86f8b46: ...
    def unpublish_an_owned_definition(self, *, path: Objectc6fb40ac8b06, query: None | None = ..., body: Objectca34d7164571, idempotency_key: str | None = ...) -> Objectc05dd86f8b46: ...
    def list_cached_authorized_discord_guilds_for_this_identity(self, *, path: None | None = ..., query: Object032a0f41ed85 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object5d5f8bee642d: ...
    def list_cached_authorized_discord_guilds_for_this_identity_items(self, *, path: None | None = ..., query: Object032a0f41ed85 | None = ..., max_pages: int = ...) -> Iterator[Objectbe0b70862b4b]: ...
    def refresh_this_identity_s_discord_guild_authorization_cache(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object40c88df59ae9: ...
    def list_notifications(self, *, path: None | None = ..., query: Objectbabf5e607dab | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> NotificationListResponse | Object18b73db2924a: ...
    def list_notifications_items(self, *, path: None | None = ..., query: Objectbabf5e607dab | None = ..., max_pages: int = ...) -> Iterator[Notification]: ...
    def delete_all_notifications(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    def get_unread_count(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> UnreadCountResponse: ...
    def mark_notification_as_read(self, *, path: Object174160ee7be7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> MessageResponse: ...
    def mark_notification_as_unread(self, *, path: Object174160ee7be7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> MessageResponse: ...
    def mark_all_notifications_as_read(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> MessageResponse: ...
    def delete_notification(self, *, path: Object174160ee7be7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    def mark_events_notifications_read(self, *, path: Objectf1a21e1989f5, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object095137da4d81: ...
    def mark_posts_notifications_read(self, *, path: Objectf1a21e1989f5, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object095137da4d81: ...
    def list_muted_items(self, *, path: None | None = ..., query: Objectdb7ab33fdb88 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> MutedListResponse: ...
    def mute_event(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> MessageResponse: ...
    def unmute_event(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    def mute_post(self, *, path: Object3456af54a19b, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> MessageResponse: ...
    def unmute_post(self, *, path: Object3456af54a19b, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    def inspect_events_mute_status(self, *, path: Object5b76758f449b, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object436c0180a936: ...
    def inspect_posts_mute_status(self, *, path: Object5b76758f449b, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object436c0180a936: ...
    def get_current_profile(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Profile: ...
    def update_profile(self, *, path: None | None = ..., query: None | None = ..., body: UpdateProfileRequest, idempotency_key: str | None = ...) -> Profile: ...
    def get_profile_by_username(self, *, path: Object3b39eec5432f, query: Objectdbdbd17de31d | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Profile: ...
    def get_privacy_settings(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> PrivacySettings: ...
    def update_privacy_settings(self, *, path: None | None = ..., query: None | None = ..., body: UpdatePrivacySettingsRequest, idempotency_key: str | None = ...) -> PrivacySettings: ...
    def get_notification_settings(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> NotificationSettings: ...
    def save_notification_preferences(self, *, path: None | None = ..., query: None | None = ..., body: UpdateNotificationSettingsRequest, idempotency_key: str | None = ...) -> NotificationSettings: ...
    def list_custom_themes(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> CustomThemeListResponse: ...
    def create_custom_theme(self, *, path: None | None = ..., query: None | None = ..., body: CreateCustomThemeRequest, idempotency_key: str | None = ...) -> CustomTheme: ...
    def get_theme_preferences(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> ThemePreferencesResponse: ...
    def set_theme_preferences(self, *, path: None | None = ..., query: None | None = ..., body: SetThemePreferenceRequest, idempotency_key: str | None = ...) -> ThemePreferencesResponse: ...
    def update_custom_theme(self, *, path: Object9e77b95ad3bf, query: None | None = ..., body: UpdateCustomThemeRequest, idempotency_key: str | None = ...) -> CustomTheme: ...
    def delete_custom_theme(self, *, path: Object9e77b95ad3bf, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    def list_link_and_email_invites(self, *, path: Object63660964c4c7, query: Objecta640a0ba8b43 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> list[InviteSummary] | Object731c934869a4: ...
    def list_link_and_email_invites_items(self, *, path: Object63660964c4c7, query: Objecta640a0ba8b43 | None = ..., max_pages: int = ...) -> Iterator[InviteSummary]: ...
    def create_link_invitation(self, *, path: Object63660964c4c7, query: None | None = ..., body: Object07989555863f, idempotency_key: str | None = ...) -> Object9022e42a11be: ...
    def create_email_invitation(self, *, path: Object63660964c4c7, query: None | None = ..., body: Objectc776b2dc18c6, idempotency_key: str | None = ...) -> Objectf584fd7f1513: ...
    def create_member_invitation(self, *, path: Object63660964c4c7, query: None | None = ..., body: Objectdcad510e393d, idempotency_key: str | None = ...) -> Objectd246a5fb6d0b: ...
    def list_username_invitations(self, *, path: Object63660964c4c7, query: Objecta63b72eda942 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectdb08a32dcd8d: ...
    def list_username_invitations_items(self, *, path: Object63660964c4c7, query: Objecta63b72eda942 | None = ..., max_pages: int = ...) -> Iterator[Object5a58404c1848]: ...
    def create_pending_invitation(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object4f3c5a171fbb: ...
    def edit_invitation(self, *, path: Object4be4d8df39e5, query: None | None = ..., body: Objected266440fefc, idempotency_key: str | None = ...) -> InviteSummary: ...
    def delete_invitation(self, *, path: Object4be4d8df39e5, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    def inspect_bearer_invitation(self, *, path: Object69a2ba95f89c, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> InvitePublic: ...
    def accept_bearer_invitation(self, *, path: Object69a2ba95f89c, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object56c24524625c: ...
    def list_username_invitations_member_invites(self, *, path: None | None = ..., query: Objecta63b72eda942 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectdb08a32dcd8d: ...
    def list_username_invitations_member_invites_items(self, *, path: None | None = ..., query: Objecta63b72eda942 | None = ..., max_pages: int = ...) -> Iterator[Object5a58404c1848]: ...
    def inspect_username_invitation(self, *, path: Object4be4d8df39e5, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object5a58404c1848: ...
    def cancel_username_invitation(self, *, path: Object4be4d8df39e5, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object8798ded7869a: ...
    def accept_username_invitation(self, *, path: Object4be4d8df39e5, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object56c24524625c: ...
    def decline_username_invitation(self, *, path: Object4be4d8df39e5, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object8798ded7869a: ...
    def invite_a_list_s_current_people_to_an_event(self, *, path: Objecte46080489a7f, query: None | None = ..., body: InviteListSend, idempotency_key: str | None = ...) -> InviteListSendResult: ...
    def edit_a_private_invite_list(self, *, path: Objecte46080489a7f, query: None | None = ..., body: UpdateInviteList, idempotency_key: str | None = ...) -> InviteListDetail: ...
    def delete_a_private_invite_list(self, *, path: Objecte46080489a7f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> DeleteInviteListResult: ...
    def inspect_a_private_invite_list(self, *, path: Objecte46080489a7f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> InviteListDetail: ...
    def search_existing_people_by_username(self, *, path: None | None = ..., query: Object880d986ee587, body: None | None = ..., idempotency_key: str | None = ...) -> InviteListPeople: ...
    def list_accepted_friend_choices(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> InviteListPeople: ...
    def list_private_invite_lists(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> InviteListCollection: ...
    def create_a_private_invite_list(self, *, path: None | None = ..., query: None | None = ..., body: CreateInviteList, idempotency_key: str | None = ...) -> InviteListDetail: ...
    def create_report(self, *, path: None | None = ..., query: None | None = ..., body: CreateReportRequest, idempotency_key: str | None = ...) -> ReportCreateResponse: ...
    def list_all_users(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> AdminUserListResponse: ...
    def delete_user(self, *, path: Object977c52831acc, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    def set_user_role(self, *, path: Object977c52831acc, query: None | None = ..., body: SetUserRoleRequest, idempotency_key: str | None = ...) -> MessageResponse: ...
    def list_all_events(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> AdminEventListResponse: ...
    def delete_event_admin(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    def list_all_reports(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> AdminReportListResponse: ...
    def inspect_upload(self, *, path: Object8ecd2a9b43ab, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectb3ad4a317683: ...

class AsyncGroupi:
    def __init__(self, *, instance: str, api_key: str | None = ..., bounded_api_key: str | None = ..., token_provider: TokenProvider | None = ..., audience: str | None = ..., retries: int = ..., timeout: float = ..., max_response_bytes: int = ...) -> None: ...
    async def upload(self, data: bytes, *, filename: str, mime_type: str = ..., purpose: Literal['attachment', 'avatar', 'cover'] = ..., event_id: str | None = ...) -> dict[str, object]: ...
    async def discard_upload(self, storage_id: str) -> None: ...
    async def health(self) -> dict[str, object]: ...
    async def require_capability(self, name: str, version: int = ...) -> dict[str, object]: ...
    def iterate_events(self, *, limit: int = ..., max_pages: int = ...) -> AsyncIterator[EventSummary]: ...
    async def get_account_responsibilities(self, *, path: None | None = ..., query: Objectffbe1c9950c8, body: None | None = ..., idempotency_key: str | None = ...) -> Objecta6ae99ae07d4: ...
    def get_account_responsibilities_items(self, *, path: None | None = ..., query: Objectffbe1c9950c8, max_pages: int = ...) -> AsyncIterator[Object946aea546666]: ...
    async def read_live_readiness_final_deletion_revalidates(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object6660c3839c76: ...
    async def post_account_delete(self, *, path: None | None = ..., query: None | None = ..., body: Object2af7fe0f9b46, idempotency_key: str | None = ...) -> Object2d05ad4bdae6: ...
    async def delete_account_responsibilities_events(self, *, path: Object0af774823b7d, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    async def post_auth_cli_exchange(self, *, path: None | None = ..., query: None | None = ..., body: Objecte5faf1f089f2, idempotency_key: str | None = ...) -> Object49bf06d9c16f: ...
    async def post_auth_cli_revoke(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object5964056f794d: ...
    async def inspect_consensual_ownership_transfer(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object8ffbbe5fe6b2 | None: ...
    async def offer_ownership_to_an_eligible_existing_member(self, *, path: Object63660964c4c7, query: None | None = ..., body: Object0c3e8abbf5ca, idempotency_key: str | None = ...) -> Object8ffbbe5fe6b2 | None: ...
    async def accept_the_named_ownership_offer(self, *, path: Object63660964c4c7, query: None | None = ..., body: Object85dd26cb8024, idempotency_key: str | None = ...) -> Object8ffbbe5fe6b2 | None: ...
    async def decline_the_named_ownership_offer(self, *, path: Object63660964c4c7, query: None | None = ..., body: Object85dd26cb8024, idempotency_key: str | None = ...) -> Object8ffbbe5fe6b2 | None: ...
    async def cancel_the_named_ownership_offer(self, *, path: Object63660964c4c7, query: None | None = ..., body: Object85dd26cb8024, idempotency_key: str | None = ...) -> Object8ffbbe5fe6b2 | None: ...
    async def read_viewer_safe_event_logistics_before_joining(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object9e90c2c3d1a5: ...
    async def discover_friends_and_group_events(self, *, path: None | None = ..., query: Objectf0fd2ef7e5a4 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object4a648d6fd5f5: ...
    def discover_friends_and_group_events_items(self, *, path: None | None = ..., query: Objectf0fd2ef7e5a4 | None = ..., max_pages: int = ...) -> AsyncIterator[Object6bb7463cee3b]: ...
    async def join_a_discoverable_event(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object1d3bbf168039: ...
    async def read_event_visibility_admission_and_permissions(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objecte5a809dc5829: ...
    async def update_event_visibility_admission_and_permissions(self, *, path: Object63660964c4c7, query: None | None = ..., body: Objectddbcd2fd4c82, idempotency_key: str | None = ...) -> Objecte5a809dc5829: ...
    async def get_events_event_id_applications_form(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objected2365fc2ed6: ...
    async def get_events_event_id_applications_history(self, *, path: Object63660964c4c7, query: Object7e06335c5475 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectb366528fe427: ...
    def get_events_event_id_applications_history_items(self, *, path: Object63660964c4c7, query: Object7e06335c5475 | None = ..., max_pages: int = ...) -> AsyncIterator[Objecta6e648a4652b]: ...
    async def get_events_event_id_applications_list(self, *, path: Object63660964c4c7, query: Object7e06335c5475 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object9607a2178a0e: ...
    def get_events_event_id_applications_list_items(self, *, path: Object63660964c4c7, query: Object7e06335c5475 | None = ..., max_pages: int = ...) -> AsyncIterator[Object0597d5e84f7c]: ...
    async def put_events_event_id_applications_settings(self, *, path: Object63660964c4c7, query: None | None = ..., body: Object85f20860c120, idempotency_key: str | None = ...) -> Object85f20860c120: ...
    async def post_events_event_id_applications(self, *, path: Object63660964c4c7, query: None | None = ..., body: Objectec2c97973b61, idempotency_key: str | None = ...) -> Object8dc03c71a240: ...
    async def post_event_applications_application_id_withdraw(self, *, path: Object715b53dc68f5, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object8dc03c71a240: ...
    async def post_event_applications_application_id_decision(self, *, path: Object715b53dc68f5, query: None | None = ..., body: Object04868a1f6ada, idempotency_key: str | None = ...) -> Object8dc03c71a240: ...
    async def list_events(self, *, path: None | None = ..., query: Objectf0fd2ef7e5a4 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> EventListResponse | EventPageResponse: ...
    def list_events_items(self, *, path: None | None = ..., query: Objectf0fd2ef7e5a4 | None = ..., max_pages: int = ...) -> AsyncIterator[EventSummary]: ...
    async def create_event(self, *, path: None | None = ..., query: None | None = ..., body: CreateEventRequest, idempotency_key: str | None = ...) -> EventCreateResponse: ...
    async def get_event(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> EventDetail: ...
    async def update_event(self, *, path: Object63660964c4c7, query: None | None = ..., body: UpdateEventRequest, idempotency_key: str | None = ...) -> EventDetail | Objectad794210902b: ...
    async def delete_event(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    async def inspect_current_account_avatar(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object0b4baf2fc1af: ...
    async def replace_current_account_avatar(self, *, path: None | None = ..., query: None | None = ..., body: Object82edc32e8e2d, idempotency_key: str | None = ...) -> Object0b4baf2fc1af: ...
    async def remove_current_account_avatar(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object0b4baf2fc1af: ...
    async def inspect_event_cover(self, *, path: Object2a37f36fe967, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object0b4baf2fc1af: ...
    async def replace_event_cover(self, *, path: Object2a37f36fe967, query: None | None = ..., body: Object8f2e07428f60, idempotency_key: str | None = ...) -> Object0b4baf2fc1af: ...
    async def remove_event_cover(self, *, path: Object2a37f36fe967, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object0b4baf2fc1af: ...
    async def list_posts(self, *, path: Object7b041e5fec41, query: Object6cdac6024129 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> list[Objectaf5c4bdda5d7] | Object87783cbc6404: ...
    def list_posts_items(self, *, path: Object7b041e5fec41, query: Object6cdac6024129 | None = ..., max_pages: int = ...) -> AsyncIterator[Objectaf5c4bdda5d7]: ...
    async def get_post(self, *, path: Object34ab70d01c28, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectbd43ca3d5411: ...
    async def update_post(self, *, path: Object34ab70d01c28, query: None | None = ..., body: Objecte63be612b92f, idempotency_key: str | None = ...) -> Objectbd43ca3d5411 | Object60ee9f02bc5d: ...
    async def delete_post(self, *, path: Object34ab70d01c28, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    async def create_post(self, *, path: Object34ab70d01c28, query: None | None = ..., body: Objecte63be612b92f, idempotency_key: str | None = ...) -> Object60ee9f02bc5d: ...
    async def list_replies(self, *, path: Object7b041e5fec41, query: Object6cdac6024129 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> list[Object009017a89888] | Objectfda4f2d5c7e6: ...
    def list_replies_items(self, *, path: Object7b041e5fec41, query: Object6cdac6024129 | None = ..., max_pages: int = ...) -> AsyncIterator[Object009017a89888]: ...
    async def get_reply(self, *, path: Object34ab70d01c28, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object009017a89888: ...
    async def update_reply(self, *, path: Object34ab70d01c28, query: None | None = ..., body: Objecte63be612b92f, idempotency_key: str | None = ...) -> Object009017a89888 | Object588b21707c8f: ...
    async def delete_reply(self, *, path: Object34ab70d01c28, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    async def create_reply(self, *, path: Object34ab70d01c28, query: None | None = ..., body: Objecte63be612b92f, idempotency_key: str | None = ...) -> Object588b21707c8f: ...
    async def list_members(self, *, path: Object63660964c4c7, query: Objectf0fd2ef7e5a4 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> MemberListResponse | Object3dd5d2118ecf: ...
    def list_members_items(self, *, path: Object63660964c4c7, query: Objectf0fd2ef7e5a4 | None = ..., max_pages: int = ...) -> AsyncIterator[Object4add9dfd0c54]: ...
    async def update_member_role(self, *, path: Object0a5f5ed92c94, query: None | None = ..., body: UpdateMemberRoleRequest, idempotency_key: str | None = ...) -> MemberDetail: ...
    async def remove_member(self, *, path: Object0a5f5ed92c94, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    async def leave_event(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> MessageResponse: ...
    async def update_r_s_v_p(self, *, path: Object63660964c4c7, query: None | None = ..., body: UpdateRsvpRequest, idempotency_key: str | None = ...) -> RsvpUpdateResponse: ...
    async def read_your_r_s_v_p(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> RsvpUpdateResponse: ...
    async def read_availability_grid(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> AvailabilityGridResponse: ...
    async def submit_availability(self, *, path: Object63660964c4c7, query: None | None = ..., body: SubmitAvailabilityRequest, idempotency_key: str | None = ...) -> SubmitAvailabilityResponse: ...
    async def clear_your_availability(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object1e88c8173d97: ...
    async def list_potential_dates(self, *, path: Object63660964c4c7, query: Objectf0fd2ef7e5a4 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> PotentialDatesResponse | Object248fc0ec5484: ...
    def list_potential_dates_items(self, *, path: Object63660964c4c7, query: Objectf0fd2ef7e5a4 | None = ..., max_pages: int = ...) -> AsyncIterator[PotentialDateTime]: ...
    async def read_your_availability(self, *, path: Object63660964c4c7, query: Objectf0fd2ef7e5a4 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object8cd0cdf0cfec: ...
    def read_your_availability_items(self, *, path: Object63660964c4c7, query: Objectf0fd2ef7e5a4 | None = ..., max_pages: int = ...) -> AsyncIterator[Objectc503c7ffa279]: ...
    async def list_availability_responses(self, *, path: Object63660964c4c7, query: Object5e8548e1584c, body: None | None = ..., idempotency_key: str | None = ...) -> Objecte06d7904516b: ...
    def list_availability_responses_items(self, *, path: Object63660964c4c7, query: Object5e8548e1584c, max_pages: int = ...) -> AsyncIterator[Object59affbc4fdba]: ...
    async def choose_event_date(self, *, path: Object63660964c4c7, query: None | None = ..., body: Object83d893372472 | Object3e2b6d8f36c1, idempotency_key: str | None = ...) -> EventDetail: ...
    async def reset_event_date(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> EventDetail: ...
    async def list_friends(self, *, path: None | None = ..., query: Objectee0c1fb649a9 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> FriendListResponse | Object0b76429c8b74: ...
    def list_friends_items(self, *, path: None | None = ..., query: Objectee0c1fb649a9 | None = ..., max_pages: int = ...) -> AsyncIterator[FriendSummary]: ...
    async def list_incoming_requests(self, *, path: None | None = ..., query: Objectee0c1fb649a9 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> FriendRequestListResponse | Object8bfb6348dae9: ...
    def list_incoming_requests_items(self, *, path: None | None = ..., query: Objectee0c1fb649a9 | None = ..., max_pages: int = ...) -> AsyncIterator[FriendRequest]: ...
    async def list_outgoing_requests(self, *, path: None | None = ..., query: Objectee0c1fb649a9 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> FriendRequestListResponse | Object8bfb6348dae9: ...
    def list_outgoing_requests_items(self, *, path: None | None = ..., query: Objectee0c1fb649a9 | None = ..., max_pages: int = ...) -> AsyncIterator[FriendRequest]: ...
    async def search_users(self, *, path: None | None = ..., query: Objectb63cbd7183d3, body: None | None = ..., idempotency_key: str | None = ...) -> UserSearchResponse: ...
    async def get_friendship_status(self, *, path: Object448825efceb1, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> FriendshipStatusResponse: ...
    async def send_friend_request(self, *, path: None | None = ..., query: None | None = ..., body: SendFriendRequest, idempotency_key: str | None = ...) -> FriendRequestResponse: ...
    async def accept_friend_request(self, *, path: Object96dfba5d30b4, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> MessageResponse: ...
    async def decline_friend_request(self, *, path: Object96dfba5d30b4, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> MessageResponse: ...
    async def cancel_friend_request(self, *, path: Object96dfba5d30b4, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    async def remove_friend(self, *, path: Object96dfba5d30b4, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    async def explicitly_announce_to_permitted_group_members(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object5652b722bc8e, idempotency_key: str | None = ...) -> Object07b930802b31: ...
    async def recover_your_explicit_announcement_request_status(self, *, path: Objectc3f4431a1c67, query: Object5d2a59b99424, body: None | None = ..., idempotency_key: str | None = ...) -> Objectb99f1ac5dcce | None: ...
    async def list_persistent_group_lists(self, *, path: Objectc3f4431a1c67, query: Objectabcad7a92e35 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object321903aa80bf: ...
    def list_persistent_group_lists_items(self, *, path: Objectc3f4431a1c67, query: Objectabcad7a92e35 | None = ..., max_pages: int = ...) -> AsyncIterator[Objectb49cb191869a]: ...
    async def create_persistent_group_list(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object8f955e380d70, idempotency_key: str | None = ...) -> Object003f9ced057a: ...
    async def get_persistent_group_lists(self, *, path: Objectadc1f508905f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object1714fdefbeb4: ...
    async def configure_persistent_group_list(self, *, path: Objectadc1f508905f, query: None | None = ..., body: Objecte9e2a0e737a4, idempotency_key: str | None = ...) -> None: ...
    async def remove_persistent_group_list(self, *, path: Objectadc1f508905f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    async def settings_persistent_group_lists(self, *, path: Objectadc1f508905f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object1714fdefbeb4: ...
    async def entries_persistent_group_lists(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object0e150b4bfa9f: ...
    def entries_persistent_group_lists_items(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., max_pages: int = ...) -> AsyncIterator[Object32cc511c23d6]: ...
    async def add_persistent_group_list(self, *, path: Objectadc1f508905f, query: None | None = ..., body: Objectc9c73e6f1496, idempotency_key: str | None = ...) -> Object2e89b7d741b1: ...
    async def own_persistent_group_lists(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object0e150b4bfa9f: ...
    def own_persistent_group_lists_items(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., max_pages: int = ...) -> AsyncIterator[Object32cc511c23d6]: ...
    async def edit_persistent_group_list(self, *, path: Object2ef4e0f19715, query: None | None = ..., body: Objectcc99fe557380, idempotency_key: str | None = ...) -> Objectaa456dc0873a: ...
    async def removeentry_persistent_group_list(self, *, path: Object2ef4e0f19715, query: None | None = ..., body: Objectef1fffec8cbc, idempotency_key: str | None = ...) -> None: ...
    async def read_owner_list_availability_and_creation_policy(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object98f4cc8bd3c7: ...
    async def owner_configures_list_availability_and_creation(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object53a746cb1440, idempotency_key: str | None = ...) -> Object2d05ad4bdae6: ...
    async def create_an_independent_persistent_ordinary_form(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Objectd2897b45c533, idempotency_key: str | None = ...) -> Object003f9ced057a: ...
    async def list_ordinary_forms_independently_of_the_joining_questionnaire(self, *, path: Objectc3f4431a1c67, query: Objectabcad7a92e35 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object321903aa80bf: ...
    def list_ordinary_forms_independently_of_the_joining_questionnaire_items(self, *, path: Objectc3f4431a1c67, query: Objectabcad7a92e35 | None = ..., max_pages: int = ...) -> AsyncIterator[Objectb49cb191869a]: ...
    async def get_groups_forms_settings(self, *, path: Objectadc1f508905f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object8b0b6b6d7659: ...
    async def read_current_form_and_your_compatible_answers(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectda991d1da7bb: ...
    async def patch_groups_forms(self, *, path: Objectadc1f508905f, query: None | None = ..., body: Object9afc4a5afed9, idempotency_key: str | None = ...) -> None: ...
    async def explicitly_delete_form_and_all_responses(self, *, path: Objectadc1f508905f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    async def read_only_your_retained_response_snapshots(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object8195a916a385: ...
    def read_only_your_retained_response_snapshots_items(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., max_pages: int = ...) -> AsyncIterator[Objectbe3c37f1eb4e]: ...
    async def read_stated_visibility_latest_responses(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object8195a916a385: ...
    def read_stated_visibility_latest_responses_items(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., max_pages: int = ...) -> AsyncIterator[Objectbe3c37f1eb4e]: ...
    async def put_groups_forms_response(self, *, path: Objectadc1f508905f, query: None | None = ..., body: Objectcffe1fccdcde, idempotency_key: str | None = ...) -> Object5db5384852d1: ...
    async def remove_your_response_and_private_retained_history(self, *, path: Objectadc1f508905f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    async def delete_groups_forms_results(self, *, path: Objectfb48a02fd4cf, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    async def read_form_availability_creation_policy(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object632de87bce2f: ...
    async def owner_controls_form_availability_and_creation(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object53a746cb1440, idempotency_key: str | None = ...) -> Object2d05ad4bdae6: ...
    async def create_an_independent_persistent_persistent_poll(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object2072a1ae5071, idempotency_key: str | None = ...) -> Object003f9ced057a: ...
    async def get_groups_polls(self, *, path: Objectc3f4431a1c67, query: Objectabcad7a92e35 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object321903aa80bf: ...
    def get_groups_polls_items(self, *, path: Objectc3f4431a1c67, query: Objectabcad7a92e35 | None = ..., max_pages: int = ...) -> AsyncIterator[Objectb49cb191869a]: ...
    async def get_groups_polls_settings(self, *, path: Objectadc1f508905f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectfd00f8f95b46: ...
    async def read_current_poll_and_your_compatible_selections(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object1cf48926007e: ...
    async def patch_groups_polls(self, *, path: Objectadc1f508905f, query: None | None = ..., body: Object800bf512e4e2, idempotency_key: str | None = ...) -> None: ...
    async def delete_a_poll_and_all_votes_as_a_current_eligible_manager(self, *, path: Objectadc1f508905f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    async def read_only_your_retained_vote_snapshots(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object6f22d6521161: ...
    def read_only_your_retained_vote_snapshots_items(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., max_pages: int = ...) -> AsyncIterator[Objectd968e063c948]: ...
    async def read_stated_visibility_latest_votes(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object1e55c0550d05: ...
    def read_stated_visibility_latest_votes_items(self, *, path: Objectadc1f508905f, query: Objectabcad7a92e35 | None = ..., max_pages: int = ...) -> AsyncIterator[Object430f2d180bd9]: ...
    async def put_groups_polls_vote(self, *, path: Objectadc1f508905f, query: None | None = ..., body: Object29c0167f9b1d, idempotency_key: str | None = ...) -> Object5db5384852d1: ...
    async def remove_your_vote_and_private_history_using_optimistic_revision(self, *, path: Objectadc1f508905f, query: None | None = ..., body: Object8c477699d177, idempotency_key: str | None = ...) -> None: ...
    async def delete_groups_polls_results(self, *, path: Objectb17b74c18a8f, query: None | None = ..., body: Object8c477699d177, idempotency_key: str | None = ...) -> None: ...
    async def read_poll_availability_creation_policy(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object67ea0bf089d7: ...
    async def owner_controls_poll_availability_and_creation(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object53a746cb1440, idempotency_key: str | None = ...) -> Object2d05ad4bdae6: ...
    async def list_your_groups(self, *, path: None | None = ..., query: Object96110c08a73a | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object598737a2dca1: ...
    def list_your_groups_items(self, *, path: None | None = ..., query: Object96110c08a73a | None = ..., max_pages: int = ...) -> AsyncIterator[Objectb7fb19a40d96]: ...
    async def create_an_owner_only_group(self, *, path: None | None = ..., query: None | None = ..., body: Objectfa3a9e641148, idempotency_key: str | None = ...) -> Object38a2ce79b0f1: ...
    async def read_an_admitted_group(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectb7fb19a40d96: ...
    async def update_group_identity_as_owner(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Objectf2a3cfe95492, idempotency_key: str | None = ...) -> None: ...
    async def explicitly_delete_a_group_as_owner(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    async def read_own_community_context(self, *, path: Objectc3f4431a1c67, query: Objecta2791daed18f | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectf8c3bec6a790: ...
    async def submit_community_application(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Objecte4ea0c62ce41, idempotency_key: str | None = ...) -> Object53e85f30308a: ...
    async def edit_community_application(self, *, path: Object0210d908b1ed, query: None | None = ..., body: Objectece999219204, idempotency_key: str | None = ...) -> Object53e85f30308a: ...
    async def withdraw_community_application(self, *, path: Object0210d908b1ed, query: None | None = ..., body: Object8c477699d177, idempotency_key: str | None = ...) -> Object53e85f30308a: ...
    async def get_groups_joining_questionnaire(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object056f6599a34c: ...
    async def put_groups_joining_questionnaire(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object624371b3aebe, idempotency_key: str | None = ...) -> Object056f6599a34c: ...
    async def submit_or_edit_private_answers_as_an_admitted_member(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object6395deb0e4ba, idempotency_key: str | None = ...) -> Object056f6599a34c: ...
    async def review_private_answers_as_current_owner_or_moderator(self, *, path: Objectc3f4431a1c67, query: Object96110c08a73a | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object61969d67aaba: ...
    def review_private_answers_as_current_owner_or_moderator_items(self, *, path: Objectc3f4431a1c67, query: Object96110c08a73a | None = ..., max_pages: int = ...) -> AsyncIterator[Object3cee5d7a2d66]: ...
    async def get_groups_joining_questionnaire_history(self, *, path: Objectc3f4431a1c67, query: Object1611008fb05a | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object97987385f170: ...
    def get_groups_joining_questionnaire_history_items(self, *, path: Objectc3f4431a1c67, query: Object1611008fb05a | None = ..., max_pages: int = ...) -> AsyncIterator[Objectb31c8114c447]: ...
    async def list_your_private_group_invitations(self, *, path: None | None = ..., query: Object24f61c89eae7 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object1357fe91c2ec: ...
    def list_your_private_group_invitations_items(self, *, path: None | None = ..., query: Object24f61c89eae7 | None = ..., max_pages: int = ...) -> AsyncIterator[Object478f41967623]: ...
    async def list_group_invitations_as_manager(self, *, path: Objectc3f4431a1c67, query: Object24f61c89eae7 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object1357fe91c2ec: ...
    def list_group_invitations_as_manager_items(self, *, path: Objectc3f4431a1c67, query: Object24f61c89eae7 | None = ..., max_pages: int = ...) -> AsyncIterator[Object478f41967623]: ...
    async def invite_an_existing_user_as_group_owner(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object3ec0572a6d9e, idempotency_key: str | None = ...) -> Objectd246a5fb6d0b: ...
    async def read_admitted_group_roster(self, *, path: Objectc3f4431a1c67, query: Object96110c08a73a | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objecte1c0fcf8b40a: ...
    def read_admitted_group_roster_items(self, *, path: Objectc3f4431a1c67, query: Object96110c08a73a | None = ..., max_pages: int = ...) -> AsyncIterator[Object7514791d9a3f]: ...
    async def configure_group_invitations_as_owner(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object64c44083196e, idempotency_key: str | None = ...) -> None: ...
    async def accept_your_group_invitation(self, *, path: Object7c5e30947e1c, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objecte0128353cd2d: ...
    async def decline_your_group_invitation(self, *, path: Object7c5e30947e1c, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objecte375ea6b235c: ...
    async def cancel_a_pending_invitation_as_group_manager(self, *, path: Object7c5e30947e1c, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objecte375ea6b235c: ...
    async def list_active_group_bans_as_manager(self, *, path: Objectc3f4431a1c67, query: Object96110c08a73a | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object35141a46d0a7: ...
    def list_active_group_bans_as_manager_items(self, *, path: Objectc3f4431a1c67, query: Object96110c08a73a | None = ..., max_pages: int = ...) -> AsyncIterator[Object1e56fe7dd0b1]: ...
    async def appoint_or_demote_a_group_moderator_as_owner(self, *, path: Object80d270ff2592, query: None | None = ..., body: Object48e20440b294, idempotency_key: str | None = ...) -> Objectbd478dc0c377: ...
    async def remove_an_ordinary_member_without_banning(self, *, path: Object80d270ff2592, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectdd6a39aba87a: ...
    async def ban_an_ordinary_member_or_nonmember(self, *, path: Object80d270ff2592, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object8bf4b7cfb096: ...
    async def lift_a_group_ban_without_admitting_membership(self, *, path: Object80d270ff2592, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object8bf4b7cfb096: ...
    async def leave_your_own_group_membership(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object80c0f0a1db81: ...
    async def read_private_participant_ownership_offer_status(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object20854cd7c77a | None: ...
    async def offer_group_responsibility_to_an_admitted_member(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object5209c9e060c4, idempotency_key: str | None = ...) -> Object20854cd7c77a | None: ...
    async def accept_the_observed_ownership_offer(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object888d9185a767, idempotency_key: str | None = ...) -> Object20854cd7c77a | None: ...
    async def decline_the_observed_ownership_offer(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object888d9185a767, idempotency_key: str | None = ...) -> Object20854cd7c77a | None: ...
    async def cancel_the_observed_ownership_offer(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object888d9185a767, idempotency_key: str | None = ...) -> Object20854cd7c77a | None: ...
    async def read_admission_questions_and_your_private_pending_application(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object7ba2960d50b6: ...
    async def configure_group_applications_as_owner(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Objecta66ce69c5289, idempotency_key: str | None = ...) -> Object8798ded7869a: ...
    async def read_your_retained_private_group_application_history(self, *, path: Objectc3f4431a1c67, query: Object96110c08a73a | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectcf0d5ee44ad5: ...
    def read_your_retained_private_group_application_history_items(self, *, path: Objectc3f4431a1c67, query: Object96110c08a73a | None = ..., max_pages: int = ...) -> AsyncIterator[Objectf006a1c397a2]: ...
    async def review_private_group_application_queue_as_manager(self, *, path: Objectc3f4431a1c67, query: Objecta91b1c668b6a | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectc3c66273bb38: ...
    def review_private_group_application_queue_as_manager_items(self, *, path: Objectc3f4431a1c67, query: Objecta91b1c668b6a | None = ..., max_pages: int = ...) -> AsyncIterator[Object84c39b4ad201]: ...
    async def submit_or_edit_your_pending_admission_application(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Objectb4f84fb246b8, idempotency_key: str | None = ...) -> Object4f75c6f32bec: ...
    async def read_a_private_application_as_its_author_or_current_manager(self, *, path: Object1536187ddb0f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectf006a1c397a2: ...
    async def edit_your_pending_answers_against_saved_question_definitions(self, *, path: Object1536187ddb0f, query: None | None = ..., body: Object400d4467dcf9, idempotency_key: str | None = ...) -> Object4f75c6f32bec: ...
    async def withdraw_your_pending_application_without_deleting_history(self, *, path: Object1536187ddb0f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object4f75c6f32bec: ...
    async def approve_or_decline_an_application_as_current_group_manager(self, *, path: Object1536187ddb0f, query: None | None = ..., body: Object026c1c76bdd8, idempotency_key: str | None = ...) -> Object4f75c6f32bec: ...
    async def get_events_audiences(self, *, path: Object0af774823b7d, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object6ca3b0de678c: ...
    async def set_independent_friends_audience_as_current_organizer(self, *, path: Object0af774823b7d, query: None | None = ..., body: Objectbc8e85e56367, idempotency_key: str | None = ...) -> Object392afdf5c5c2: ...
    async def configure_whole_group_event_sharing_as_owner(self, *, path: Objectc3f4431a1c67, query: None | None = ..., body: Object6e16a7e029f2, idempotency_key: str | None = ...) -> Object8798ded7869a: ...
    async def share_with_a_whole_group_with_both_permissions(self, *, path: Object507f8507399f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object4a2b5fd38217: ...
    async def withdraw_one_group_grant_without_affecting_other_audiences(self, *, path: Object507f8507399f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object4a2b5fd38217: ...
    async def delete_groups_events(self, *, path: Object507f8507399f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object4a2b5fd38217: ...
    async def get_groups_events(self, *, path: Objectc3f4431a1c67, query: Object96110c08a73a | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object9f4b613046fe: ...
    def get_groups_events_items(self, *, path: Objectc3f4431a1c67, query: Object96110c08a73a | None = ..., max_pages: int = ...) -> AsyncIterator[Object7b5e95a37930]: ...
    async def list_blocked_users_bounded_cursor_pages(self, *, path: None | None = ..., query: Objectee0c1fb649a9 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object476a5720ad4f: ...
    def list_blocked_users_bounded_cursor_pages_items(self, *, path: None | None = ..., query: Objectee0c1fb649a9 | None = ..., max_pages: int = ...) -> AsyncIterator[Object90355adbcd73]: ...
    async def inspect_block_relationship(self, *, path: Object49e7860ab2a6, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object806772894c12: ...
    async def block_user_and_remove_friendships_requests(self, *, path: Object49e7860ab2a6, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> MessageResponse: ...
    async def unblock_user(self, *, path: Object49e7860ab2a6, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    async def list_your_existing_published_custom_templates(self, *, path: None | None = ..., query: Object82f2072d92bc | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> list[Object6ec7a36191ae] | Object4dc45c542b89: ...
    def list_your_existing_published_custom_templates_items(self, *, path: None | None = ..., query: Object82f2072d92bc | None = ..., max_pages: int = ...) -> AsyncIterator[Object6ec7a36191ae]: ...
    async def post_events_addons_participation(self, *, path: Object4a8443ff6a1a, query: None | None = ..., body: Object0db44385f557, idempotency_key: str | None = ...) -> Object2d05ad4bdae6 | Objectb5ab3e5b460c | Object556f4f3df304: ...
    async def list_add_ons(self, *, path: Object63660964c4c7, query: Object82f2072d92bc | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> AddonListResponse | Object812fae11d33a: ...
    def list_add_ons_items(self, *, path: Object63660964c4c7, query: Object82f2072d92bc | None = ..., max_pages: int = ...) -> AsyncIterator[AddonConfig]: ...
    async def enable_add_on(self, *, path: Object4a8443ff6a1a, query: None | None = ..., body: EnableAddonRequest, idempotency_key: str | None = ...) -> MessageResponse: ...
    async def disable_add_on(self, *, path: Object4a8443ff6a1a, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> MessageResponse: ...
    async def update_add_on_config(self, *, path: Object4a8443ff6a1a, query: None | None = ..., body: UpdateAddonConfigRequest, idempotency_key: str | None = ...) -> AddonConfig: ...
    async def list_add_on_data(self, *, path: Object4a8443ff6a1a, query: Object82f2072d92bc | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> AddonDataListResponse | Objectb418e20abe35: ...
    def list_add_on_data_items(self, *, path: Object4a8443ff6a1a, query: Object82f2072d92bc | None = ..., max_pages: int = ...) -> AsyncIterator[AddonDataEntry]: ...
    async def set_add_on_data(self, *, path: Object9c4e853d82c3, query: None | None = ..., body: SetAddonDataRequest, idempotency_key: str | None = ...) -> AddonDataEntry: ...
    async def delete_add_on_data(self, *, path: Object9c4e853d82c3, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    async def list_owned_draft_and_published_definitions(self, *, path: None | None = ..., query: Object032a0f41ed85 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object04b6a50da866: ...
    def list_owned_draft_and_published_definitions_items(self, *, path: None | None = ..., query: Object032a0f41ed85 | None = ..., max_pages: int = ...) -> AsyncIterator[Objectc05dd86f8b46]: ...
    async def create_a_complete_definition_as_a_draft(self, *, path: None | None = ..., query: None | None = ..., body: Object7d2b597814a5, idempotency_key: str | None = ...) -> Objectc05dd86f8b46: ...
    async def read_an_owned_definition(self, *, path: Objectc6fb40ac8b06, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectc05dd86f8b46: ...
    async def replace_an_owned_definition_at_the_expected_version(self, *, path: Objectc6fb40ac8b06, query: None | None = ..., body: Objectb56ae94c0c8e, idempotency_key: str | None = ...) -> Objectc05dd86f8b46: ...
    async def delete_addon_template_definitions(self, *, path: Objectc6fb40ac8b06, query: Objectda9a27f0c6c6, body: None | None = ..., idempotency_key: str | None = ...) -> Object36f05472f96c: ...
    async def publish_an_owned_definition(self, *, path: Objectc6fb40ac8b06, query: None | None = ..., body: Objectca34d7164571, idempotency_key: str | None = ...) -> Objectc05dd86f8b46: ...
    async def unpublish_an_owned_definition(self, *, path: Objectc6fb40ac8b06, query: None | None = ..., body: Objectca34d7164571, idempotency_key: str | None = ...) -> Objectc05dd86f8b46: ...
    async def list_cached_authorized_discord_guilds_for_this_identity(self, *, path: None | None = ..., query: Object032a0f41ed85 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object5d5f8bee642d: ...
    def list_cached_authorized_discord_guilds_for_this_identity_items(self, *, path: None | None = ..., query: Object032a0f41ed85 | None = ..., max_pages: int = ...) -> AsyncIterator[Objectbe0b70862b4b]: ...
    async def refresh_this_identity_s_discord_guild_authorization_cache(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object40c88df59ae9: ...
    async def list_notifications(self, *, path: None | None = ..., query: Objectbabf5e607dab | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> NotificationListResponse | Object18b73db2924a: ...
    def list_notifications_items(self, *, path: None | None = ..., query: Objectbabf5e607dab | None = ..., max_pages: int = ...) -> AsyncIterator[Notification]: ...
    async def delete_all_notifications(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    async def get_unread_count(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> UnreadCountResponse: ...
    async def mark_notification_as_read(self, *, path: Object174160ee7be7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> MessageResponse: ...
    async def mark_notification_as_unread(self, *, path: Object174160ee7be7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> MessageResponse: ...
    async def mark_all_notifications_as_read(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> MessageResponse: ...
    async def delete_notification(self, *, path: Object174160ee7be7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    async def mark_events_notifications_read(self, *, path: Objectf1a21e1989f5, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object095137da4d81: ...
    async def mark_posts_notifications_read(self, *, path: Objectf1a21e1989f5, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object095137da4d81: ...
    async def list_muted_items(self, *, path: None | None = ..., query: Objectdb7ab33fdb88 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> MutedListResponse: ...
    async def mute_event(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> MessageResponse: ...
    async def unmute_event(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    async def mute_post(self, *, path: Object3456af54a19b, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> MessageResponse: ...
    async def unmute_post(self, *, path: Object3456af54a19b, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    async def inspect_events_mute_status(self, *, path: Object5b76758f449b, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object436c0180a936: ...
    async def inspect_posts_mute_status(self, *, path: Object5b76758f449b, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object436c0180a936: ...
    async def get_current_profile(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Profile: ...
    async def update_profile(self, *, path: None | None = ..., query: None | None = ..., body: UpdateProfileRequest, idempotency_key: str | None = ...) -> Profile: ...
    async def get_profile_by_username(self, *, path: Object3b39eec5432f, query: Objectdbdbd17de31d | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Profile: ...
    async def get_privacy_settings(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> PrivacySettings: ...
    async def update_privacy_settings(self, *, path: None | None = ..., query: None | None = ..., body: UpdatePrivacySettingsRequest, idempotency_key: str | None = ...) -> PrivacySettings: ...
    async def get_notification_settings(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> NotificationSettings: ...
    async def save_notification_preferences(self, *, path: None | None = ..., query: None | None = ..., body: UpdateNotificationSettingsRequest, idempotency_key: str | None = ...) -> NotificationSettings: ...
    async def list_custom_themes(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> CustomThemeListResponse: ...
    async def create_custom_theme(self, *, path: None | None = ..., query: None | None = ..., body: CreateCustomThemeRequest, idempotency_key: str | None = ...) -> CustomTheme: ...
    async def get_theme_preferences(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> ThemePreferencesResponse: ...
    async def set_theme_preferences(self, *, path: None | None = ..., query: None | None = ..., body: SetThemePreferenceRequest, idempotency_key: str | None = ...) -> ThemePreferencesResponse: ...
    async def update_custom_theme(self, *, path: Object9e77b95ad3bf, query: None | None = ..., body: UpdateCustomThemeRequest, idempotency_key: str | None = ...) -> CustomTheme: ...
    async def delete_custom_theme(self, *, path: Object9e77b95ad3bf, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    async def list_link_and_email_invites(self, *, path: Object63660964c4c7, query: Objecta640a0ba8b43 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> list[InviteSummary] | Object731c934869a4: ...
    def list_link_and_email_invites_items(self, *, path: Object63660964c4c7, query: Objecta640a0ba8b43 | None = ..., max_pages: int = ...) -> AsyncIterator[InviteSummary]: ...
    async def create_link_invitation(self, *, path: Object63660964c4c7, query: None | None = ..., body: Object07989555863f, idempotency_key: str | None = ...) -> Object9022e42a11be: ...
    async def create_email_invitation(self, *, path: Object63660964c4c7, query: None | None = ..., body: Objectc776b2dc18c6, idempotency_key: str | None = ...) -> Objectf584fd7f1513: ...
    async def create_member_invitation(self, *, path: Object63660964c4c7, query: None | None = ..., body: Objectdcad510e393d, idempotency_key: str | None = ...) -> Objectd246a5fb6d0b: ...
    async def list_username_invitations(self, *, path: Object63660964c4c7, query: Objecta63b72eda942 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectdb08a32dcd8d: ...
    def list_username_invitations_items(self, *, path: Object63660964c4c7, query: Objecta63b72eda942 | None = ..., max_pages: int = ...) -> AsyncIterator[Object5a58404c1848]: ...
    async def create_pending_invitation(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object4f3c5a171fbb: ...
    async def edit_invitation(self, *, path: Object4be4d8df39e5, query: None | None = ..., body: Objected266440fefc, idempotency_key: str | None = ...) -> InviteSummary: ...
    async def delete_invitation(self, *, path: Object4be4d8df39e5, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    async def inspect_bearer_invitation(self, *, path: Object69a2ba95f89c, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> InvitePublic: ...
    async def accept_bearer_invitation(self, *, path: Object69a2ba95f89c, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object56c24524625c: ...
    async def list_username_invitations_member_invites(self, *, path: None | None = ..., query: Objecta63b72eda942 | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectdb08a32dcd8d: ...
    def list_username_invitations_member_invites_items(self, *, path: None | None = ..., query: Objecta63b72eda942 | None = ..., max_pages: int = ...) -> AsyncIterator[Object5a58404c1848]: ...
    async def inspect_username_invitation(self, *, path: Object4be4d8df39e5, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object5a58404c1848: ...
    async def cancel_username_invitation(self, *, path: Object4be4d8df39e5, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object8798ded7869a: ...
    async def accept_username_invitation(self, *, path: Object4be4d8df39e5, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object56c24524625c: ...
    async def decline_username_invitation(self, *, path: Object4be4d8df39e5, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Object8798ded7869a: ...
    async def invite_a_list_s_current_people_to_an_event(self, *, path: Objecte46080489a7f, query: None | None = ..., body: InviteListSend, idempotency_key: str | None = ...) -> InviteListSendResult: ...
    async def edit_a_private_invite_list(self, *, path: Objecte46080489a7f, query: None | None = ..., body: UpdateInviteList, idempotency_key: str | None = ...) -> InviteListDetail: ...
    async def delete_a_private_invite_list(self, *, path: Objecte46080489a7f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> DeleteInviteListResult: ...
    async def inspect_a_private_invite_list(self, *, path: Objecte46080489a7f, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> InviteListDetail: ...
    async def search_existing_people_by_username(self, *, path: None | None = ..., query: Object880d986ee587, body: None | None = ..., idempotency_key: str | None = ...) -> InviteListPeople: ...
    async def list_accepted_friend_choices(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> InviteListPeople: ...
    async def list_private_invite_lists(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> InviteListCollection: ...
    async def create_a_private_invite_list(self, *, path: None | None = ..., query: None | None = ..., body: CreateInviteList, idempotency_key: str | None = ...) -> InviteListDetail: ...
    async def create_report(self, *, path: None | None = ..., query: None | None = ..., body: CreateReportRequest, idempotency_key: str | None = ...) -> ReportCreateResponse: ...
    async def list_all_users(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> AdminUserListResponse: ...
    async def delete_user(self, *, path: Object977c52831acc, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    async def set_user_role(self, *, path: Object977c52831acc, query: None | None = ..., body: SetUserRoleRequest, idempotency_key: str | None = ...) -> MessageResponse: ...
    async def list_all_events(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> AdminEventListResponse: ...
    async def delete_event_admin(self, *, path: Object63660964c4c7, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> None: ...
    async def list_all_reports(self, *, path: None | None = ..., query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> AdminReportListResponse: ...
    async def inspect_upload(self, *, path: Object8ecd2a9b43ab, query: None | None = ..., body: None | None = ..., idempotency_key: str | None = ...) -> Objectb3ad4a317683: ...

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

class Objectf8c3bec6a790(TypedDict):
    contractVersion: Literal['red-room.v1']
    group: Object59509cf0ec83
    form: Objecta61bf08328e7
    membership: Object5b35bc95b99b | None
    eligibility: Object9181a91b6751
    applications: list[Object1c6ddd22f0f6]
    nextCursor: str | None
    grantedActions: list[str]
    allowedActions: list[str]
    announcementPreference: Object068ecbb0d0bb

class Objecta2791daed18f(TypedDict):
    cursor: NotRequired[str]

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

class Object9181a91b6751(TypedDict):
    canApply: bool
    canAccessMemberContent: bool
    banned: bool

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

class Object878ec63794f7(TypedDict):
    applicationId: str
    status: Literal['PENDING', 'WITHDRAWN', 'APPROVED', 'DECLINED']
    revision: float

class Object14927e6acaac(TypedDict):
    email: Literal['not-requested']
    cleanup: Literal['not-requested']

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

class Object8d74f2ccf6a9(TypedDict):
    groupId: str
    name: str

class Object4e2be9f6831d(TypedDict):
    id: str
    name: str | None
    email: str | None
    image: str | None
    username: str | None

class Object1fa6adfb22bd(TypedDict):
    status: Literal['PENDING', 'WITHDRAWN', 'APPROVED', 'DECLINED']
    at: float

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
