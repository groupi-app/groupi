from .types import (
    ErrorResponse,
    EventListResponse,
    EventSummary,
    EventPageResponse,
    EventCreateResponse,
    CreateEventRequest,
    EventDetail,
    UserSummary,
    UpdateEventRequest,
    MemberListResponse,
    MemberDetail,
    UpdateMemberRoleRequest,
    MessageResponse,
    RsvpUpdateResponse,
    UpdateRsvpRequest,
    AvailabilityGridResponse,
    AvailabilityGridEntry,
    PotentialDateTime,
    UserAvailability,
    SubmitAvailabilityResponse,
    SubmitAvailabilityRequest,
    PotentialDatesResponse,
    FriendListResponse,
    FriendSummary,
    FriendRequestListResponse,
    FriendRequest,
    UserSearchResponse,
    UserSearchResult,
    FriendshipStatusResponse,
    FriendRequestResponse,
    SendFriendRequest,
    AddonListResponse,
    AddonConfig,
    EnableAddonRequest,
    UpdateAddonConfigRequest,
    AddonDataListResponse,
    AddonDataEntry,
    SetAddonDataRequest,
    NotificationListResponse,
    Notification,
    UnreadCountResponse,
    MutedListResponse,
    MutedEvent,
    MutedPost,
    Profile,
    UpdateProfileRequest,
    PrivacySettings,
    UpdatePrivacySettingsRequest,
    NotificationSettings,
    NotificationMethod,
    NotificationTypeSetting,
    UpdateNotificationSettingsRequest,
    CustomThemeListResponse,
    CustomTheme,
    TokenOverrides,
    ThemePreferencesResponse,
    SetThemePreferenceRequest,
    CreateCustomThemeRequest,
    UpdateCustomThemeRequest,
    InviteSummary,
    InvitePublic,
    InviteListSendResult,
    InviteListSend,
    InviteListDetail,
    InviteListPerson,
    InviteListSummary,
    UpdateInviteList,
    DeleteInviteListResult,
    InviteListPeople,
    SelectableInviteListPerson,
    InviteListCollection,
    CreateInviteList,
    ReportCreateResponse,
    CreateReportRequest,
    AdminUserListResponse,
    AdminUserSummary,
    SetUserRoleRequest,
    AdminEventListResponse,
    AdminEventSummary,
    AdminReportListResponse,
    ReportSummary,
    DelegatedToken,
    TokenProvider,
    Object3f70f6db216f,
    Object044ce32ee4b4,
    Objectce98b1903941,
    Object0775184639f6,
    Object4add9dfd0c54,
    Object0ad4fa4c1cfd,
    Object8820f6b447f2,
    Object3e4107d97d81,
    Object47d24df37cde,
    Object68e2071237a2,
    Object4200ac2b790a,
    Objectb1df2f3763f1,
    Object69802845beed,
    Objectfa39780def0b,
    Object54bdd6572a9c,
    Object21dc10e86adf,
    Object02c010229f76,
    Objectd53e7a082e12,
    Object0216e5b199fe,
    Object6ec82ed2d838,
    Objectc24f606b22f3,
    Objectf82be304b3e2,
    Object76f39dd7d1f8,
    Object8747d622a8ab,
    Object0c58cdddeef8,
    Object7388a1973d88,
    Objecta40edc26256c,
    Object028edd10051b,
    Objectf0baf57f0dd1,
    Object4e7204ad5011,
    Object35e7b1a54aee,
    Objecta6ae99ae07d4,
    Objectffbe1c9950c8,
    Object946aea546666,
    Object6660c3839c76,
    Object2d05ad4bdae6,
    Object2af7fe0f9b46,
    Object0af774823b7d,
    Object49bf06d9c16f,
    Objecte5faf1f089f2,
    Object5964056f794d,
    Object8ffbbe5fe6b2,
    Object63660964c4c7,
    Object0c3e8abbf5ca,
    Object85dd26cb8024,
    Object9e90c2c3d1a5,
    Object4a648d6fd5f5,
    Objectf0fd2ef7e5a4,
    Object6bb7463cee3b,
    Object1d3bbf168039,
    Objecte5a809dc5829,
    Objectddbcd2fd4c82,
    Object37a4e2d22e60,
    Object46a622af52af,
    Object401e6f77e181,
    Objected2365fc2ed6,
    Objectb366528fe427,
    Object7e06335c5475,
    Objecta6e648a4652b,
    Object9607a2178a0e,
    Object0597d5e84f7c,
    Object85f20860c120,
    Object8dc03c71a240,
    Objectec2c97973b61,
    Object715b53dc68f5,
    Object04868a1f6ada,
    Objectad794210902b,
    Object0b4baf2fc1af,
    Object82edc32e8e2d,
    Object2a37f36fe967,
    Object8f2e07428f60,
    Objectaf5c4bdda5d7,
    Object87783cbc6404,
    Object7b041e5fec41,
    Object6cdac6024129,
    Objectbd43ca3d5411,
    Object34ab70d01c28,
    Object60ee9f02bc5d,
    Objecte63be612b92f,
    Object009017a89888,
    Objectfda4f2d5c7e6,
    Object588b21707c8f,
    Object3dd5d2118ecf,
    Object0a5f5ed92c94,
    Object1e88c8173d97,
    Object248fc0ec5484,
    Object8cd0cdf0cfec,
    Objectc503c7ffa279,
    Objecte06d7904516b,
    Object5e8548e1584c,
    Object59affbc4fdba,
    Object83d893372472,
    Object3e2b6d8f36c1,
    Object0b76429c8b74,
    Objectee0c1fb649a9,
    Object8bfb6348dae9,
    Objectb63cbd7183d3,
    Object448825efceb1,
    Object96dfba5d30b4,
    Object07b930802b31,
    Objectc3f4431a1c67,
    Object5652b722bc8e,
    Objectb99f1ac5dcce,
    Object5d2a59b99424,
    Object321903aa80bf,
    Objectabcad7a92e35,
    Objectb49cb191869a,
    Object003f9ced057a,
    Object8f955e380d70,
    Object1714fdefbeb4,
    Objectadc1f508905f,
    Objecte9e2a0e737a4,
    Object0e150b4bfa9f,
    Object32cc511c23d6,
    Object2e89b7d741b1,
    Objectc9c73e6f1496,
    Objectaa456dc0873a,
    Object2ef4e0f19715,
    Objectcc99fe557380,
    Objectef1fffec8cbc,
    Object98f4cc8bd3c7,
    Object53a746cb1440,
    Objectd2897b45c533,
    Object8b0b6b6d7659,
    Objectda991d1da7bb,
    Object9afc4a5afed9,
    Object8195a916a385,
    Objectbe3c37f1eb4e,
    Object5db5384852d1,
    Objectcffe1fccdcde,
    Objectfb48a02fd4cf,
    Object632de87bce2f,
    Object2072a1ae5071,
    Objectfd00f8f95b46,
    Object1cf48926007e,
    Object800bf512e4e2,
    Object6f22d6521161,
    Objectd968e063c948,
    Object1e55c0550d05,
    Object430f2d180bd9,
    Object29c0167f9b1d,
    Object8c477699d177,
    Objectb17b74c18a8f,
    Object67ea0bf089d7,
    Objectdb9cf5ae94c2,
    Object2da0580f7d57,
    Objectb063e6348ffd,
    Object73ecf7f47670,
    Object98f626d2887e,
    Object598737a2dca1,
    Object96110c08a73a,
    Objectb7fb19a40d96,
    Object38a2ce79b0f1,
    Objectfa3a9e641148,
    Objectf2a3cfe95492,
    Object7e8a2ce9dd0e,
    Object40f81eb82dda,
    Objecta2791daed18f,
    Object6edaff610f96,
    Object97dfec76315a,
    Object0b7836604670,
    Objectd0927d889d39,
    Object662cba3b4b77,
    Object309b8d6ee3c7,
    Object288ba65ddff3,
    Object55bc59b678b3,
    Object6c49c59c24af,
    Object53e85f30308a,
    Objecte4ea0c62ce41,
    Object0210d908b1ed,
    Objectece999219204,
    Object39140cd5ad6d,
    Objectb93f36757224,
    Object69655f599fd1,
    Objectefb5209ee17a,
    Object6f0e18d58953,
    Object056f6599a34c,
    Object624371b3aebe,
    Object6395deb0e4ba,
    Object61969d67aaba,
    Object3cee5d7a2d66,
    Object97987385f170,
    Object1611008fb05a,
    Objectb31c8114c447,
    Object1357fe91c2ec,
    Object24f61c89eae7,
    Object478f41967623,
    Objectd246a5fb6d0b,
    Object3ec0572a6d9e,
    Objecte1c0fcf8b40a,
    Object7514791d9a3f,
    Object64c44083196e,
    Objecte0128353cd2d,
    Object7c5e30947e1c,
    Objecte375ea6b235c,
    Object35141a46d0a7,
    Object1e56fe7dd0b1,
    Objectbd478dc0c377,
    Object80d270ff2592,
    Object48e20440b294,
    Objectdd6a39aba87a,
    Object8bf4b7cfb096,
    Object80c0f0a1db81,
    Object20854cd7c77a,
    Object5209c9e060c4,
    Object888d9185a767,
    Object7ba2960d50b6,
    Object8798ded7869a,
    Objecta66ce69c5289,
    Objectcf0d5ee44ad5,
    Objectf006a1c397a2,
    Objectc3c66273bb38,
    Objecta91b1c668b6a,
    Object84c39b4ad201,
    Object4f75c6f32bec,
    Objectb4f84fb246b8,
    Object1536187ddb0f,
    Object400d4467dcf9,
    Object026c1c76bdd8,
    Object6ca3b0de678c,
    Object392afdf5c5c2,
    Objectbc8e85e56367,
    Object6e16a7e029f2,
    Object4a2b5fd38217,
    Object507f8507399f,
    Object9f4b613046fe,
    Object7b5e95a37930,
    Object476a5720ad4f,
    Object90355adbcd73,
    Object806772894c12,
    Object49e7860ab2a6,
    Object6ec7a36191ae,
    Object4dc45c542b89,
    Object82f2072d92bc,
    Objectb5ab3e5b460c,
    Object556f4f3df304,
    Object4a8443ff6a1a,
    Object0db44385f557,
    Object812fae11d33a,
    Objectb418e20abe35,
    Object9c4e853d82c3,
    Object04b6a50da866,
    Object032a0f41ed85,
    Objectc05dd86f8b46,
    Object7d2b597814a5,
    Objectc6fb40ac8b06,
    Objectb56ae94c0c8e,
    Object36f05472f96c,
    Objectda9a27f0c6c6,
    Objectca34d7164571,
    Object5d5f8bee642d,
    Objectbe0b70862b4b,
    Object40c88df59ae9,
    Object18b73db2924a,
    Objectbabf5e607dab,
    Object174160ee7be7,
    Object095137da4d81,
    Objectf1a21e1989f5,
    Objectdb7ab33fdb88,
    Object3456af54a19b,
    Object436c0180a936,
    Object5b76758f449b,
    Object3b39eec5432f,
    Objectdbdbd17de31d,
    Object9e77b95ad3bf,
    Object731c934869a4,
    Objecta640a0ba8b43,
    Object9022e42a11be,
    Object07989555863f,
    Objectf584fd7f1513,
    Objectc776b2dc18c6,
    Objectdcad510e393d,
    Object93c182c49f8d,
    Object99130a4c6676,
    Objectfa7a7c11cfbb,
    Object4f3c5a171fbb,
    Object4be4d8df39e5,
    Objected266440fefc,
    Object69a2ba95f89c,
    Object56c24524625c,
    Objecte46080489a7f,
    Object880d986ee587,
    Object977c52831acc,
    Objectb3ad4a317683,
    Object8ecd2a9b43ab,
    Objectf6ca76572e97,
    Object3cd40e9719f2,
    Object356518753784,
    Objectd3056924d246,
    Object9f4a98fa38c1,
    Object65bba3d62a1c,
    Objecte86accd2d51f,
    Object5b24a1db1824,
    Objectb9a0c2603865,
    Object78716c45d186,
    Object658127a26002,
    Objectf8ccad6cf3b8,
    Object8d74f2ccf6a9,
    Object83558e3bc551,
    Object14927e6acaac,
    Object9d78b8568e9e,
    Objectde38060a32b6,
    Object6a6aeb3276ba,
    Object6388f0c60c78,
    Objecta28dee2fad43,
    Object8fdfc205d0bb,
    Objectc7f956fcace9,
    Object8be06601360f,
    Object8f4fd078f9a3,
    Object6d5274c5de2d,
    Object2c98a6bfd5c6,
    Objecte8244d61f3c4,
    Objectb27f127421ba,
    Object59509cf0ec83,
    Objecta61bf08328e7,
    Object6ffc35fcb505,
    Objecta021a3f479e7,
    Object9a607b8a62e8,
    Objectd9ee0d5fe0e0,
    Object8f7560a6b20e,
    Object427b94380342,
    Objectf03c0b814f7e,
    Objecte942149005cb,
    Objectfc3c77e1d00a,
    Object878ec63794f7,
    Object5ebfeba959d7,
    Objectcb244cc36b34,
    Objectafe89b003106,
    Object17c8fd7ccf8b,
    Object57afa53f5f81,
    Object7892060edd7e,
    Object1590d2c92435,
    Object5153d73d401b,
    Object9fdf648cf373,
    Object4675ce302d32,
    Object6376b80743c1,
    Object01562b3a7fb5,
    Object50ef760e0f66,
    Object4e2be9f6831d,
    Object1fa6adfb22bd,
    Object1e0b443bfaa7,
    Object7cd832af6593,
    Object30a6d58642d2,
    Object5b771084f9e7,
    Objectf13ad84fbfdc,
    Object020897d2fabb,
)
"""Generated named public REST v2 operations. Do not edit manually."""
from .transport import Transport, AsyncTransport

class Groupi(Transport):
    def get_account_responsibilities(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Enumerate all current owned Groups or Events, including unresolved offers."""
        return self.request('GET', '/account/responsibilities', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def get_account_responsibilities_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/account/responsibilities', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor'}, max_pages=max_pages)

    def read_live_readiness_final_deletion_revalidates(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read live readiness; final deletion revalidates."""
        return self.request('GET', '/account/readiness', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def post_account_delete(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Permanently delete the authenticated account after live responsibility resolution."""
        return self.request('POST', '/account/delete', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def delete_account_responsibilities_events(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Explicitly delete an owned Event, including legacy membership inconsistencies."""
        return self.request('DELETE', '/account/responsibilities/events/{eventId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def post_auth_cli_exchange(self, *, path=None, query=None, body=None, idempotency_key=None):
        """."""
        return self.request('POST', '/auth/cli/exchange', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def post_auth_cli_revoke(self, *, path=None, query=None, body=None, idempotency_key=None):
        """."""
        return self.request('POST', '/auth/cli/revoke', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def inspect_consensual_ownership_transfer(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Inspect consensual ownership transfer."""
        return self.request('GET', '/events/{eventId}/ownership-transfer', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def offer_ownership_to_an_eligible_existing_member(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Offer ownership to an eligible existing member."""
        return self.request('POST', '/events/{eventId}/ownership-transfer', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def accept_the_named_ownership_offer(self, *, path=None, query=None, body=None, idempotency_key=None):
        """accept the named ownership offer."""
        return self.request('POST', '/events/{eventId}/ownership-transfer/accept', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def decline_the_named_ownership_offer(self, *, path=None, query=None, body=None, idempotency_key=None):
        """decline the named ownership offer."""
        return self.request('POST', '/events/{eventId}/ownership-transfer/decline', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def cancel_the_named_ownership_offer(self, *, path=None, query=None, body=None, idempotency_key=None):
        """cancel the named ownership offer."""
        return self.request('POST', '/events/{eventId}/ownership-transfer/cancel', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_viewer_safe_event_logistics_before_joining(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read viewer-safe event logistics before joining."""
        return self.request('GET', '/events/{eventId}/logistics', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def discover_friends_and_group_events(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Discover Friends and Group events."""
        return self.request('GET', '/events/discover', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def discover_friends_and_group_events_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/events/discover', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, max_pages=max_pages)

    def join_a_discoverable_event(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Join a discoverable event."""
        return self.request('POST', '/events/{eventId}/join', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_event_visibility_admission_and_permissions(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read event visibility, admission and permissions."""
        return self.request('GET', '/events/{eventId}/settings', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def update_event_visibility_admission_and_permissions(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Update event visibility, admission and permissions."""
        return self.request('PATCH', '/events/{eventId}/settings', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_event_lifecycle(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read Organizer lifecycle and revision."""
        return self.request('GET', '/events/{eventId}/lifecycle', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def update_event_lifecycle(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Complete, reopen or reschedule as current Organizer."""
        return self.request('POST', '/events/{eventId}/lifecycle', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def get_events_event_id_applications_form(self, *, path=None, query=None, body=None, idempotency_key=None):
        """."""
        return self.request('GET', '/events/{eventId}/applications/form', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def get_events_event_id_applications_history(self, *, path=None, query=None, body=None, idempotency_key=None):
        """."""
        return self.request('GET', '/events/{eventId}/applications/history', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def get_events_event_id_applications_history_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/events/{eventId}/applications/history', path=path, query=query, adapter={'items': 'page', 'cursor': 'continueCursor', 'done': 'isDone'}, max_pages=max_pages)

    def get_events_event_id_applications_list(self, *, path=None, query=None, body=None, idempotency_key=None):
        """."""
        return self.request('GET', '/events/{eventId}/applications/list', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def get_events_event_id_applications_list_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/events/{eventId}/applications/list', path=path, query=query, adapter={'items': 'page', 'cursor': 'continueCursor', 'done': 'isDone'}, max_pages=max_pages)

    def put_events_event_id_applications_settings(self, *, path=None, query=None, body=None, idempotency_key=None):
        """."""
        return self.request('PUT', '/events/{eventId}/applications/settings', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def post_events_event_id_applications(self, *, path=None, query=None, body=None, idempotency_key=None):
        """."""
        return self.request('POST', '/events/{eventId}/applications', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def post_event_applications_application_id_withdraw(self, *, path=None, query=None, body=None, idempotency_key=None):
        """."""
        return self.request('POST', '/event-applications/{applicationId}/withdraw', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def post_event_applications_application_id_decision(self, *, path=None, query=None, body=None, idempotency_key=None):
        """."""
        return self.request('POST', '/event-applications/{applicationId}/decision', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_events(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List events."""
        return self.request('GET', '/events', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_events_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/events', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, max_pages=max_pages)

    def create_event(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Create event."""
        return self.request('POST', '/events', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def get_event(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Get event."""
        return self.request('GET', '/events/{eventId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def update_event(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Update event."""
        return self.request('PATCH', '/events/{eventId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def delete_event(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Delete event."""
        return self.request('DELETE', '/events/{eventId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def inspect_current_account_avatar(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Inspect current account avatar."""
        return self.request('GET', '/profile/avatar', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def replace_current_account_avatar(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Replace current account avatar."""
        return self.request('PUT', '/profile/avatar', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def remove_current_account_avatar(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Remove current account avatar."""
        return self.request('DELETE', '/profile/avatar', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def inspect_event_cover(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Inspect event cover."""
        return self.request('GET', '/events/{eventId}/cover', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def replace_event_cover(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Replace event cover."""
        return self.request('PUT', '/events/{eventId}/cover', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def remove_event_cover(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Remove event cover."""
        return self.request('DELETE', '/events/{eventId}/cover', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_posts(self, *, path=None, query=None, body=None, idempotency_key=None):
        """."""
        return self.request('GET', '/events/{parentId}/posts', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_posts_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/events/{parentId}/posts', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, max_pages=max_pages)

    def get_post(self, *, path=None, query=None, body=None, idempotency_key=None):
        """."""
        return self.request('GET', '/posts/{id}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def update_post(self, *, path=None, query=None, body=None, idempotency_key=None):
        """."""
        return self.request('PATCH', '/posts/{id}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def delete_post(self, *, path=None, query=None, body=None, idempotency_key=None):
        """."""
        return self.request('DELETE', '/posts/{id}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def create_post(self, *, path=None, query=None, body=None, idempotency_key=None):
        """."""
        return self.request('POST', '/events/{id}/posts', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_replies(self, *, path=None, query=None, body=None, idempotency_key=None):
        """."""
        return self.request('GET', '/posts/{parentId}/replies', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_replies_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/posts/{parentId}/replies', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, max_pages=max_pages)

    def get_reply(self, *, path=None, query=None, body=None, idempotency_key=None):
        """."""
        return self.request('GET', '/replies/{id}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def update_reply(self, *, path=None, query=None, body=None, idempotency_key=None):
        """."""
        return self.request('PATCH', '/replies/{id}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def delete_reply(self, *, path=None, query=None, body=None, idempotency_key=None):
        """."""
        return self.request('DELETE', '/replies/{id}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def create_reply(self, *, path=None, query=None, body=None, idempotency_key=None):
        """."""
        return self.request('POST', '/posts/{id}/replies', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_members(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List members."""
        return self.request('GET', '/events/{eventId}/members', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_members_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/events/{eventId}/members', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, max_pages=max_pages)

    def update_member_role(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Update member role."""
        return self.request('PATCH', '/events/{eventId}/members/{memberId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def remove_member(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Remove member."""
        return self.request('DELETE', '/events/{eventId}/members/{memberId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def leave_event(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Leave event."""
        return self.request('POST', '/events/{eventId}/leave', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def update_r_s_v_p(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Update RSVP."""
        return self.request('PATCH', '/events/{eventId}/rsvp', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_your_r_s_v_p(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read your RSVP."""
        return self.request('GET', '/events/{eventId}/rsvp', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_availability_grid(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read availability grid."""
        return self.request('GET', '/events/{eventId}/availability', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def submit_availability(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Submit availability."""
        return self.request('POST', '/events/{eventId}/availability', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def clear_your_availability(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Clear your availability."""
        return self.request('DELETE', '/events/{eventId}/availability', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_potential_dates(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List potential dates."""
        return self.request('GET', '/events/{eventId}/potential-dates', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_potential_dates_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/events/{eventId}/potential-dates', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, max_pages=max_pages)

    def read_your_availability(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read your availability."""
        return self.request('GET', '/events/{eventId}/availability/mine', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_your_availability_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/events/{eventId}/availability/mine', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, max_pages=max_pages)

    def list_availability_responses(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List availability responses."""
        return self.request('GET', '/events/{eventId}/availability/responses', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_availability_responses_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/events/{eventId}/availability/responses', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, max_pages=max_pages)

    def choose_event_date(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Choose event date."""
        return self.request('POST', '/events/{eventId}/date', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def reset_event_date(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Reset event date."""
        return self.request('DELETE', '/events/{eventId}/date', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_friends(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List friends."""
        return self.request('GET', '/friends', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_friends_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/friends', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, max_pages=max_pages)

    def list_incoming_requests(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List incoming requests."""
        return self.request('GET', '/friends/requests/incoming', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_incoming_requests_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/friends/requests/incoming', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, max_pages=max_pages)

    def list_outgoing_requests(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List outgoing requests."""
        return self.request('GET', '/friends/requests/outgoing', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_outgoing_requests_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/friends/requests/outgoing', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, max_pages=max_pages)

    def search_users(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Search users."""
        return self.request('GET', '/friends/search', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def get_friendship_status(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Get friendship status."""
        return self.request('GET', '/friends/status/{targetPersonId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def send_friend_request(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Send friend request."""
        return self.request('POST', '/friends/requests', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def accept_friend_request(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Accept friend request."""
        return self.request('POST', '/friends/requests/{friendshipId}/accept', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def decline_friend_request(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Decline friend request."""
        return self.request('POST', '/friends/requests/{friendshipId}/decline', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def cancel_friend_request(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Cancel friend request."""
        return self.request('DELETE', '/friends/requests/{friendshipId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def remove_friend(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Remove friend."""
        return self.request('DELETE', '/friends/{friendshipId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def explicitly_announce_to_permitted_group_members(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Explicitly announce to permitted Group members."""
        return self.request('POST', '/groups/{groupId}/announcements', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def recover_your_explicit_announcement_request_status(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Recover your explicit announcement request status."""
        return self.request('GET', '/groups/{groupId}/announcements/status', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_persistent_group_lists(self, *, path=None, query=None, body=None, idempotency_key=None):
        """list persistent Group lists."""
        return self.request('GET', '/groups/{groupId}/lists', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_persistent_group_lists_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/groups/{groupId}/lists', path=path, query=query, adapter={'items': 'page', 'cursor': 'continueCursor', 'done': 'isDone'}, max_pages=max_pages)

    def create_persistent_group_list(self, *, path=None, query=None, body=None, idempotency_key=None):
        """create persistent Group list."""
        return self.request('POST', '/groups/{groupId}/lists', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def get_persistent_group_lists(self, *, path=None, query=None, body=None, idempotency_key=None):
        """get persistent Group lists."""
        return self.request('GET', '/groups/{groupId}/lists/{toolId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def configure_persistent_group_list(self, *, path=None, query=None, body=None, idempotency_key=None):
        """configure persistent Group list."""
        return self.request('PATCH', '/groups/{groupId}/lists/{toolId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def remove_persistent_group_list(self, *, path=None, query=None, body=None, idempotency_key=None):
        """remove persistent Group list."""
        return self.request('DELETE', '/groups/{groupId}/lists/{toolId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def settings_persistent_group_lists(self, *, path=None, query=None, body=None, idempotency_key=None):
        """settings persistent Group lists."""
        return self.request('GET', '/groups/{groupId}/lists/{toolId}/settings', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def entries_persistent_group_lists(self, *, path=None, query=None, body=None, idempotency_key=None):
        """entries persistent Group lists."""
        return self.request('GET', '/groups/{groupId}/lists/{toolId}/entries', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def entries_persistent_group_lists_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/groups/{groupId}/lists/{toolId}/entries', path=path, query=query, adapter={'items': 'page', 'cursor': 'continueCursor', 'done': 'isDone'}, max_pages=max_pages)

    def add_persistent_group_list(self, *, path=None, query=None, body=None, idempotency_key=None):
        """add persistent Group list."""
        return self.request('POST', '/groups/{groupId}/lists/{toolId}/entries', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def own_persistent_group_lists(self, *, path=None, query=None, body=None, idempotency_key=None):
        """own persistent Group lists."""
        return self.request('GET', '/groups/{groupId}/lists/{toolId}/own', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def own_persistent_group_lists_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/groups/{groupId}/lists/{toolId}/own', path=path, query=query, adapter={'items': 'page', 'cursor': 'continueCursor', 'done': 'isDone'}, max_pages=max_pages)

    def edit_persistent_group_list(self, *, path=None, query=None, body=None, idempotency_key=None):
        """edit persistent Group list."""
        return self.request('PATCH', '/groups/{groupId}/lists/{toolId}/entries/{entryId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def removeentry_persistent_group_list(self, *, path=None, query=None, body=None, idempotency_key=None):
        """removeEntry persistent Group list."""
        return self.request('DELETE', '/groups/{groupId}/lists/{toolId}/entries/{entryId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_owner_list_availability_and_creation_policy(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read owner list availability and creation policy."""
        return self.request('GET', '/groups/{groupId}/list-policy', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def owner_configures_list_availability_and_creation(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Owner configures list availability and creation."""
        return self.request('PUT', '/groups/{groupId}/list-policy', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def create_an_independent_persistent_ordinary_form(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Create an independent persistent ordinary form."""
        return self.request('POST', '/groups/{groupId}/forms', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_ordinary_forms_independently_of_the_joining_questionnaire(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List ordinary forms independently of the joining questionnaire."""
        return self.request('GET', '/groups/{groupId}/forms', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_ordinary_forms_independently_of_the_joining_questionnaire_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/groups/{groupId}/forms', path=path, query=query, adapter={'items': 'page', 'cursor': 'continueCursor', 'done': 'isDone'}, max_pages=max_pages)

    def get_groups_forms_settings(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read preserved form configuration as a current eligible manager, including while disabled."""
        return self.request('GET', '/groups/{groupId}/forms/{toolId}/settings', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_current_form_and_your_compatible_answers(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read current form and your compatible answers."""
        return self.request('GET', '/groups/{groupId}/forms/{toolId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def patch_groups_forms(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Manage current form configuration without erasing saved definitions."""
        return self.request('PATCH', '/groups/{groupId}/forms/{toolId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def explicitly_delete_form_and_all_responses(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Explicitly delete form and all responses."""
        return self.request('DELETE', '/groups/{groupId}/forms/{toolId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_only_your_retained_response_snapshots(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read only your retained response snapshots."""
        return self.request('GET', '/groups/{groupId}/forms/{toolId}/history', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_only_your_retained_response_snapshots_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/groups/{groupId}/forms/{toolId}/history', path=path, query=query, adapter={'items': 'page', 'cursor': 'continueCursor', 'done': 'isDone'}, max_pages=max_pages)

    def read_stated_visibility_latest_responses(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read stated-visibility latest responses."""
        return self.request('GET', '/groups/{groupId}/forms/{toolId}/results', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_stated_visibility_latest_responses_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/groups/{groupId}/forms/{toolId}/results', path=path, query=query, adapter={'items': 'page', 'cursor': 'continueCursor', 'done': 'isDone'}, max_pages=max_pages)

    def put_groups_forms_response(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Submit or edit your validated response using current form and response revisions."""
        return self.request('PUT', '/groups/{groupId}/forms/{toolId}/response', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def remove_your_response_and_private_retained_history(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Remove your response and private retained history."""
        return self.request('DELETE', '/groups/{groupId}/forms/{toolId}/response', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def delete_groups_forms_results(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Moderate a current ordinary response including anonymous shared content."""
        return self.request('DELETE', '/groups/{groupId}/forms/{toolId}/results/{responseId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_form_availability_creation_policy(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read form availability/creation policy."""
        return self.request('GET', '/groups/{groupId}/form-policy', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def owner_controls_form_availability_and_creation(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Owner controls form availability and creation."""
        return self.request('PUT', '/groups/{groupId}/form-policy', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def create_an_independent_persistent_persistent_poll(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Create an independent persistent persistent poll."""
        return self.request('POST', '/groups/{groupId}/polls', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def get_groups_polls(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List persistent polls independently of the joining questionnaire."""
        return self.request('GET', '/groups/{groupId}/polls', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def get_groups_polls_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/groups/{groupId}/polls', path=path, query=query, adapter={'items': 'page', 'cursor': 'continueCursor', 'done': 'isDone'}, max_pages=max_pages)

    def get_groups_polls_settings(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read preserved poll configuration as a current eligible manager, including while disabled."""
        return self.request('GET', '/groups/{groupId}/polls/{toolId}/settings', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_current_poll_and_your_compatible_selections(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read current poll and your compatible selections."""
        return self.request('GET', '/groups/{groupId}/polls/{toolId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def patch_groups_polls(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Manage current poll configuration without erasing saved definitions."""
        return self.request('PATCH', '/groups/{groupId}/polls/{toolId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def delete_a_poll_and_all_votes_as_a_current_eligible_manager(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Delete a poll and all votes as a current eligible manager."""
        return self.request('DELETE', '/groups/{groupId}/polls/{toolId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_only_your_retained_vote_snapshots(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read only your retained vote snapshots."""
        return self.request('GET', '/groups/{groupId}/polls/{toolId}/history', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_only_your_retained_vote_snapshots_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/groups/{groupId}/polls/{toolId}/history', path=path, query=query, adapter={'items': 'page', 'cursor': 'continueCursor', 'done': 'isDone'}, max_pages=max_pages)

    def read_stated_visibility_latest_votes(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read stated-visibility latest votes."""
        return self.request('GET', '/groups/{groupId}/polls/{toolId}/results', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_stated_visibility_latest_votes_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/groups/{groupId}/polls/{toolId}/results', path=path, query=query, adapter={'items': 'page', 'cursor': 'continueCursor', 'done': 'isDone'}, max_pages=max_pages)

    def put_groups_polls_vote(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Submit or edit your validated vote using current poll and vote revisions."""
        return self.request('PUT', '/groups/{groupId}/polls/{toolId}/vote', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def remove_your_vote_and_private_history_using_optimistic_revision(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Remove your vote and private history using optimistic revision."""
        return self.request('DELETE', '/groups/{groupId}/polls/{toolId}/vote', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def delete_groups_polls_results(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Moderate a current ordinary vote including anonymous shared content."""
        return self.request('DELETE', '/groups/{groupId}/polls/{toolId}/results/{voteId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_poll_availability_creation_policy(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read poll availability/creation policy."""
        return self.request('GET', '/groups/{groupId}/poll-policy', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def owner_controls_poll_availability_and_creation(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Owner controls poll availability and creation."""
        return self.request('PUT', '/groups/{groupId}/poll-policy', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def expel_community_member(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Commit coordinated community exclusion as staff."""
        return self.request('POST', '/groups/{groupId}/coordinated-expulsions', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_community_expulsion(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Reconcile coordinated exclusion progress as current staff."""
        return self.request('GET', '/groups/{groupId}/coordinated-expulsions/{personId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def resume_community_expulsion(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Resume cleanup with current independent Event authority."""
        return self.request('POST', '/groups/{groupId}/coordinated-expulsions/{personId}/resume', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def reinstate_community_member(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Reinstate after complete cleanup without restoring admission."""
        return self.request('POST', '/groups/{groupId}/coordinated-expulsions/{personId}/reinstate', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_your_groups(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List your Groups."""
        return self.request('GET', '/groups', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_your_groups_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/groups', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor'}, max_pages=max_pages)

    def create_an_owner_only_group(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Create an owner-only Group."""
        return self.request('POST', '/groups', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_an_admitted_group(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read an admitted Group."""
        return self.request('GET', '/groups/{groupId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def update_group_identity_as_owner(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Update Group identity as owner."""
        return self.request('PATCH', '/groups/{groupId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def explicitly_delete_a_group_as_owner(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Explicitly delete a Group as owner."""
        return self.request('DELETE', '/groups/{groupId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_own_community_context(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read own community context."""
        return self.request('GET', '/groups/{groupId}/community-context', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_current_community_event(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read the single current selected Group Event."""
        return self.request('GET', '/groups/{groupId}/current-event', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def join_community_event(self, *, path=None, query=None, body=None, idempotency_key=None):
        """joinCommunityEvent."""
        return self.request('POST', '/groups/{groupId}/events/{eventId}/join', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def set_community_rsvp(self, *, path=None, query=None, body=None, idempotency_key=None):
        """setCommunityRsvp."""
        return self.request('PUT', '/groups/{groupId}/events/{eventId}/own-rsvp', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def leave_community_event(self, *, path=None, query=None, body=None, idempotency_key=None):
        """leaveCommunityEvent."""
        return self.request('POST', '/groups/{groupId}/events/{eventId}/leave', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def leave_community(self, *, path=None, query=None, body=None, idempotency_key=None):
        """leaveCommunity."""
        return self.request('POST', '/groups/{groupId}/community-leave', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def submit_community_application(self, *, path=None, query=None, body=None, idempotency_key=None):
        """submitCommunityApplication."""
        return self.request('POST', '/groups/{groupId}/community-applications', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def edit_community_application(self, *, path=None, query=None, body=None, idempotency_key=None):
        """editCommunityApplication."""
        return self.request('PATCH', '/groups/{groupId}/community-applications/{applicationId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def withdraw_community_application(self, *, path=None, query=None, body=None, idempotency_key=None):
        """withdrawCommunityApplication."""
        return self.request('POST', '/groups/{groupId}/community-applications/{applicationId}/withdraw', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def set_community_announcement_preference(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Change own Group announcement subscription."""
        return self.request('PUT', '/groups/{groupId}/announcement-preference', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_own_group_discord_status(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read own selected Group Discord access and Open Discord destination."""
        return self.request('GET', '/groups/{groupId}/discord', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def begin_own_group_discord_connect(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Begin a Groupi-hosted member identity and consent journey."""
        return self.request('POST', '/groups/{groupId}/discord/connect', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def get_groups_joining_questionnaire(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read your private joining questionnaire and current access status."""
        return self.request('GET', '/groups/{groupId}/joining-questionnaire', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def put_groups_joining_questionnaire(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Configure the joining questionnaire and completion policy as Group owner."""
        return self.request('PUT', '/groups/{groupId}/joining-questionnaire', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def submit_or_edit_private_answers_as_an_admitted_member(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Submit or edit private answers as an admitted member."""
        return self.request('PUT', '/groups/{groupId}/joining-questionnaire/answers', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def review_private_answers_as_current_owner_or_moderator(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Review private answers as current owner or moderator."""
        return self.request('GET', '/groups/{groupId}/joining-questionnaire/responses', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def review_private_answers_as_current_owner_or_moderator_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/groups/{groupId}/joining-questionnaire/responses', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor'}, max_pages=max_pages)

    def get_groups_joining_questionnaire_history(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read own retained answer history or review an author as current manager."""
        return self.request('GET', '/groups/{groupId}/joining-questionnaire/history', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def get_groups_joining_questionnaire_history_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/groups/{groupId}/joining-questionnaire/history', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor'}, max_pages=max_pages)

    def list_your_private_group_invitations(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List your private Group invitations."""
        return self.request('GET', '/group-invites', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_your_private_group_invitations_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/group-invites', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor'}, max_pages=max_pages)

    def list_group_invitations_as_manager(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List Group invitations as manager."""
        return self.request('GET', '/groups/{groupId}/invitations', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_group_invitations_as_manager_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/groups/{groupId}/invitations', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor'}, max_pages=max_pages)

    def invite_an_existing_user_as_group_owner(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Invite an existing user as Group owner."""
        return self.request('POST', '/groups/{groupId}/invitations', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_admitted_group_roster(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read admitted Group roster."""
        return self.request('GET', '/groups/{groupId}/members', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_admitted_group_roster_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/groups/{groupId}/members', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor'}, max_pages=max_pages)

    def configure_group_invitations_as_owner(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Configure Group invitations as owner."""
        return self.request('PATCH', '/groups/{groupId}/invitation-policy', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def accept_your_group_invitation(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Accept your Group invitation."""
        return self.request('POST', '/group-invites/{inviteId}/accept', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def decline_your_group_invitation(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Decline your Group invitation."""
        return self.request('POST', '/group-invites/{inviteId}/decline', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def cancel_a_pending_invitation_as_group_manager(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Cancel a pending invitation as Group manager."""
        return self.request('POST', '/group-invites/{inviteId}/cancel', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_active_group_bans_as_manager(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List active Group bans as manager."""
        return self.request('GET', '/groups/{groupId}/bans', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_active_group_bans_as_manager_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/groups/{groupId}/bans', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor'}, max_pages=max_pages)

    def appoint_or_demote_a_group_moderator_as_owner(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Appoint or demote a Group moderator as owner."""
        return self.request('PATCH', '/groups/{groupId}/members/{personId}/role', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def remove_an_ordinary_member_without_banning(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Remove an ordinary member without banning."""
        return self.request('DELETE', '/groups/{groupId}/members/{personId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def ban_an_ordinary_member_or_nonmember(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Ban an ordinary member or nonmember."""
        return self.request('PUT', '/groups/{groupId}/bans/{personId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def lift_a_group_ban_without_admitting_membership(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Lift a Group ban without admitting membership."""
        return self.request('DELETE', '/groups/{groupId}/bans/{personId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def leave_your_own_group_membership(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Leave your own Group membership."""
        return self.request('POST', '/groups/{groupId}/leave', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_private_participant_ownership_offer_status(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read private participant ownership offer status."""
        return self.request('GET', '/groups/{groupId}/ownership-transfer', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def offer_group_responsibility_to_an_admitted_member(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Offer Group responsibility to an admitted member."""
        return self.request('POST', '/groups/{groupId}/ownership-transfer', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def accept_the_observed_ownership_offer(self, *, path=None, query=None, body=None, idempotency_key=None):
        """accept the observed ownership offer."""
        return self.request('POST', '/groups/{groupId}/ownership-transfer/accept', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def decline_the_observed_ownership_offer(self, *, path=None, query=None, body=None, idempotency_key=None):
        """decline the observed ownership offer."""
        return self.request('POST', '/groups/{groupId}/ownership-transfer/decline', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def cancel_the_observed_ownership_offer(self, *, path=None, query=None, body=None, idempotency_key=None):
        """cancel the observed ownership offer."""
        return self.request('POST', '/groups/{groupId}/ownership-transfer/cancel', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_admission_questions_and_your_private_pending_application(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read admission questions and your private pending application."""
        return self.request('GET', '/groups/{groupId}/application-form', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def configure_group_applications_as_owner(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Configure Group applications as owner."""
        return self.request('PUT', '/groups/{groupId}/application-settings', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_your_retained_private_group_application_history(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read your retained private Group application history."""
        return self.request('GET', '/groups/{groupId}/applications/mine', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_your_retained_private_group_application_history_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/groups/{groupId}/applications/mine', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor'}, max_pages=max_pages)

    def review_private_group_application_queue_as_manager(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Review private Group application queue as manager."""
        return self.request('GET', '/groups/{groupId}/applications', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def review_private_group_application_queue_as_manager_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/groups/{groupId}/applications', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor'}, max_pages=max_pages)

    def submit_or_edit_your_pending_admission_application(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Submit or edit your pending admission application."""
        return self.request('POST', '/groups/{groupId}/applications', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_a_private_application_as_its_author_or_current_manager(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read a private application as its author or current manager."""
        return self.request('GET', '/groups/{groupId}/applications/{applicationId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def edit_your_pending_answers_against_saved_question_definitions(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Edit your pending answers against saved question definitions."""
        return self.request('PATCH', '/groups/{groupId}/applications/{applicationId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def withdraw_your_pending_application_without_deleting_history(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Withdraw your pending application without deleting history."""
        return self.request('POST', '/groups/{groupId}/applications/{applicationId}/withdraw', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def approve_or_decline_an_application_as_current_group_manager(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Approve or decline an application as current Group manager."""
        return self.request('POST', '/groups/{groupId}/applications/{applicationId}/review', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def get_events_audiences(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read only viewer-visible Group associations and Organizer Friends setting."""
        return self.request('GET', '/events/{eventId}/audiences', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def set_independent_friends_audience_as_current_organizer(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Set independent Friends audience as current Organizer."""
        return self.request('PUT', '/events/{eventId}/audiences/friends', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def configure_whole_group_event_sharing_as_owner(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Configure whole-Group Event sharing as owner."""
        return self.request('PUT', '/groups/{groupId}/event-sharing', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def share_with_a_whole_group_with_both_permissions(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Share with a whole Group with both permissions."""
        return self.request('POST', '/events/{eventId}/audiences/groups/{groupId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def withdraw_one_group_grant_without_affecting_other_audiences(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Withdraw one Group grant without affecting other audiences."""
        return self.request('DELETE', '/events/{eventId}/audiences/groups/{groupId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def delete_groups_events(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Withdraw this Group grant as current Group manager; conveys no Event authority."""
        return self.request('DELETE', '/groups/{groupId}/events/{eventId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def get_groups_events(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read safe upcoming/undated Group Event previews in bounded association-order pages."""
        return self.request('GET', '/groups/{groupId}/events', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def get_groups_events_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/groups/{groupId}/events', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor'}, max_pages=max_pages)

    def list_blocked_users_bounded_cursor_pages(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List blocked users (bounded cursor pages)."""
        return self.request('GET', '/blocks', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_blocked_users_bounded_cursor_pages_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/blocks', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, max_pages=max_pages)

    def inspect_block_relationship(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Inspect block relationship."""
        return self.request('GET', '/blocks/{personId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def block_user_and_remove_friendships_requests(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Block user and remove friendships/requests."""
        return self.request('POST', '/blocks/{personId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def unblock_user(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Unblock user."""
        return self.request('DELETE', '/blocks/{personId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_your_existing_published_custom_templates(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List your existing published custom templates."""
        return self.request('GET', '/addon-templates', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_your_existing_published_custom_templates_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/addon-templates', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, max_pages=max_pages)

    def post_events_addons_participation(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Perform an app-supported participant action as the current identity."""
        return self.request('POST', '/events/{eventId}/addons/{addonType}/participation', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_add_ons(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List add-ons."""
        return self.request('GET', '/events/{eventId}/addons', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_add_ons_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/events/{eventId}/addons', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, max_pages=max_pages)

    def enable_add_on(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Enable add-on."""
        return self.request('POST', '/events/{eventId}/addons/{addonType}/enable', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def disable_add_on(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Disable add-on."""
        return self.request('POST', '/events/{eventId}/addons/{addonType}/disable', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def update_add_on_config(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Update add-on config."""
        return self.request('PATCH', '/events/{eventId}/addons/{addonType}/config', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_add_on_data(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List add-on data."""
        return self.request('GET', '/events/{eventId}/addons/{addonType}/data', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_add_on_data_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/events/{eventId}/addons/{addonType}/data', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, max_pages=max_pages)

    def set_add_on_data(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Set add-on data."""
        return self.request('PUT', '/events/{eventId}/addons/{addonType}/data/{key}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def delete_add_on_data(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Delete add-on data."""
        return self.request('DELETE', '/events/{eventId}/addons/{addonType}/data/{key}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_owned_draft_and_published_definitions(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List owned draft and published definitions."""
        return self.request('GET', '/addon-template-definitions', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_owned_draft_and_published_definitions_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/addon-template-definitions', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor'}, max_pages=max_pages)

    def create_a_complete_definition_as_a_draft(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Create a complete definition as a draft."""
        return self.request('POST', '/addon-template-definitions', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def read_an_owned_definition(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read an owned definition."""
        return self.request('GET', '/addon-template-definitions/{id}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def replace_an_owned_definition_at_the_expected_version(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Replace an owned definition at the expected version."""
        return self.request('PATCH', '/addon-template-definitions/{id}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def delete_addon_template_definitions(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Delete an owned definition without changing enabled event snapshots."""
        return self.request('DELETE', '/addon-template-definitions/{id}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def publish_an_owned_definition(self, *, path=None, query=None, body=None, idempotency_key=None):
        """publish an owned definition."""
        return self.request('POST', '/addon-template-definitions/{id}/publish', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def unpublish_an_owned_definition(self, *, path=None, query=None, body=None, idempotency_key=None):
        """unpublish an owned definition."""
        return self.request('POST', '/addon-template-definitions/{id}/unpublish', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_cached_authorized_discord_guilds_for_this_identity(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List cached authorized Discord guilds for this identity."""
        return self.request('GET', '/discord/guilds', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_cached_authorized_discord_guilds_for_this_identity_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/discord/guilds', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor'}, max_pages=max_pages)

    def refresh_this_identity_s_discord_guild_authorization_cache(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Refresh this identity’s Discord guild authorization cache."""
        return self.request('POST', '/discord/guilds/refresh', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_notifications(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List notifications."""
        return self.request('GET', '/notifications', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_notifications_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/notifications', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, max_pages=max_pages)

    def delete_all_notifications(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Delete all notifications."""
        return self.request('DELETE', '/notifications', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def get_unread_count(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Get unread count."""
        return self.request('GET', '/notifications/count', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def mark_notification_as_read(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Mark notification as read."""
        return self.request('POST', '/notifications/{notificationId}/read', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def mark_notification_as_unread(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Mark notification as unread."""
        return self.request('POST', '/notifications/{notificationId}/unread', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def mark_all_notifications_as_read(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Mark all notifications as read."""
        return self.request('POST', '/notifications/read-all', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def delete_notification(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Delete notification."""
        return self.request('DELETE', '/notifications/{notificationId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def mark_events_notifications_read(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Mark events notifications read."""
        return self.request('POST', '/notifications/events/{scopeId}/read', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def mark_posts_notifications_read(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Mark posts notifications read."""
        return self.request('POST', '/notifications/posts/{scopeId}/read', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_muted_items(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List muted items."""
        return self.request('GET', '/muting', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def mute_event(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Mute event."""
        return self.request('POST', '/muting/events/{eventId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def unmute_event(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Unmute event."""
        return self.request('DELETE', '/muting/events/{eventId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def mute_post(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Mute post."""
        return self.request('POST', '/muting/posts/{postId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def unmute_post(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Unmute post."""
        return self.request('DELETE', '/muting/posts/{postId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def inspect_events_mute_status(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Inspect events mute status."""
        return self.request('GET', '/muting/events/{targetId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def inspect_posts_mute_status(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Inspect posts mute status."""
        return self.request('GET', '/muting/posts/{targetId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def get_current_profile(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Get current profile."""
        return self.request('GET', '/profile', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def update_profile(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Update profile."""
        return self.request('PUT', '/profile', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def get_profile_by_username(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Get profile by username."""
        return self.request('GET', '/profile/{username}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def get_privacy_settings(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Get privacy settings."""
        return self.request('GET', '/settings/privacy', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def update_privacy_settings(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Update privacy settings."""
        return self.request('PUT', '/settings/privacy', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def get_notification_settings(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Get notification settings."""
        return self.request('GET', '/settings/notifications', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def save_notification_preferences(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Save notification preferences."""
        return self.request('PUT', '/settings/notifications', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_custom_themes(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List custom themes."""
        return self.request('GET', '/themes', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def create_custom_theme(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Create custom theme."""
        return self.request('POST', '/themes', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def get_theme_preferences(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Get theme preferences."""
        return self.request('GET', '/themes/preferences', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def set_theme_preferences(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Set theme preferences."""
        return self.request('PUT', '/themes/preferences', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def update_custom_theme(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Update custom theme."""
        return self.request('PUT', '/themes/{themeId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def delete_custom_theme(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Delete custom theme."""
        return self.request('DELETE', '/themes/{themeId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_link_and_email_invites(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List link and email invites."""
        return self.request('GET', '/events/{eventId}/invites', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_link_and_email_invites_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/events/{eventId}/invites', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, max_pages=max_pages)

    def create_link_invitation(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Create link invitation."""
        return self.request('POST', '/events/{eventId}/invites', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def create_email_invitation(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Create email invitation."""
        return self.request('POST', '/events/{eventId}/invites/email', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def create_member_invitation(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Create member invitation."""
        return self.request('POST', '/events/{eventId}/member-invites', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_username_invitations(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List username invitations."""
        return self.request('GET', '/events/{eventId}/member-invites', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_username_invitations_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/events/{eventId}/member-invites', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, max_pages=max_pages)

    def create_pending_invitation(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Create pending invitation."""
        return self.request('POST', '/events/{eventId}/invites/send-pending', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def edit_invitation(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Edit invitation."""
        return self.request('PATCH', '/invites/{inviteId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def delete_invitation(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Delete invitation."""
        return self.request('DELETE', '/invites/{inviteId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def inspect_bearer_invitation(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Inspect bearer invitation."""
        return self.request('GET', '/invites/{token}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def accept_bearer_invitation(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Accept bearer invitation."""
        return self.request('POST', '/invites/{token}/accept', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_username_invitations_member_invites(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List username invitations."""
        return self.request('GET', '/member-invites', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_username_invitations_member_invites_items(self, *, path=None, query=None, max_pages=10000):
        return self.iterate('/member-invites', path=path, query=query, adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, max_pages=max_pages)

    def inspect_username_invitation(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Inspect username invitation."""
        return self.request('GET', '/member-invites/{inviteId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def cancel_username_invitation(self, *, path=None, query=None, body=None, idempotency_key=None):
        """cancel username invitation."""
        return self.request('DELETE', '/member-invites/{inviteId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def accept_username_invitation(self, *, path=None, query=None, body=None, idempotency_key=None):
        """accept username invitation."""
        return self.request('POST', '/member-invites/{inviteId}/accept', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def decline_username_invitation(self, *, path=None, query=None, body=None, idempotency_key=None):
        """decline username invitation."""
        return self.request('POST', '/member-invites/{inviteId}/decline', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def invite_a_list_s_current_people_to_an_event(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Invite a list’s current people to an event."""
        return self.request('POST', '/invite-lists/{inviteListId}/invite-to-event', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def edit_a_private_invite_list(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Edit a private Invite list."""
        return self.request('PATCH', '/invite-lists/{inviteListId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def delete_a_private_invite_list(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Delete a private Invite list."""
        return self.request('DELETE', '/invite-lists/{inviteListId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def inspect_a_private_invite_list(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Inspect a private Invite list."""
        return self.request('GET', '/invite-lists/{inviteListId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def search_existing_people_by_username(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Search existing people by username."""
        return self.request('GET', '/invite-lists/people/search', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_accepted_friend_choices(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List accepted friend choices."""
        return self.request('GET', '/invite-lists/people/friends', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_private_invite_lists(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List private Invite lists."""
        return self.request('GET', '/invite-lists', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def create_a_private_invite_list(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Create a private Invite list."""
        return self.request('POST', '/invite-lists', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def create_report(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Create report."""
        return self.request('POST', '/reports', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_all_users(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List all users."""
        return self.request('GET', '/admin/users', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def delete_user(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Delete user."""
        return self.request('DELETE', '/admin/users/{userId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def set_user_role(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Set user role."""
        return self.request('PUT', '/admin/users/{userId}/role', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_all_events(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List all events."""
        return self.request('GET', '/admin/events', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def delete_event_admin(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Delete event (admin)."""
        return self.request('DELETE', '/admin/events/{eventId}', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def list_all_reports(self, *, path=None, query=None, body=None, idempotency_key=None):
        """List all reports."""
        return self.request('GET', '/admin/reports', path=path, query=query, body=body, idempotency_key=idempotency_key)

    def inspect_upload(self, *, path=None, query=None, body=None, idempotency_key=None):
        """Read an accessible file descriptor."""
        return self.request('GET', '/uploads/{storageId}', path=path, query=query, body=body, idempotency_key=idempotency_key)


class AsyncGroupi(AsyncTransport):
    def get_account_responsibilities_items(self, **kwargs):
        return self.iterate('/account/responsibilities', adapter={'items': 'items', 'cursor': 'nextCursor'}, **kwargs)

    async def get_account_responsibilities(self, **kwargs):
        """Enumerate all current owned Groups or Events, including unresolved offers."""
        return await self.request('GET', '/account/responsibilities', **kwargs)

    async def read_live_readiness_final_deletion_revalidates(self, **kwargs):
        """Read live readiness; final deletion revalidates."""
        return await self.request('GET', '/account/readiness', **kwargs)

    async def post_account_delete(self, **kwargs):
        """Permanently delete the authenticated account after live responsibility resolution."""
        return await self.request('POST', '/account/delete', **kwargs)

    async def delete_account_responsibilities_events(self, **kwargs):
        """Explicitly delete an owned Event, including legacy membership inconsistencies."""
        return await self.request('DELETE', '/account/responsibilities/events/{eventId}', **kwargs)

    async def post_auth_cli_exchange(self, **kwargs):
        """."""
        return await self.request('POST', '/auth/cli/exchange', **kwargs)

    async def post_auth_cli_revoke(self, **kwargs):
        """."""
        return await self.request('POST', '/auth/cli/revoke', **kwargs)

    async def inspect_consensual_ownership_transfer(self, **kwargs):
        """Inspect consensual ownership transfer."""
        return await self.request('GET', '/events/{eventId}/ownership-transfer', **kwargs)

    async def offer_ownership_to_an_eligible_existing_member(self, **kwargs):
        """Offer ownership to an eligible existing member."""
        return await self.request('POST', '/events/{eventId}/ownership-transfer', **kwargs)

    async def accept_the_named_ownership_offer(self, **kwargs):
        """accept the named ownership offer."""
        return await self.request('POST', '/events/{eventId}/ownership-transfer/accept', **kwargs)

    async def decline_the_named_ownership_offer(self, **kwargs):
        """decline the named ownership offer."""
        return await self.request('POST', '/events/{eventId}/ownership-transfer/decline', **kwargs)

    async def cancel_the_named_ownership_offer(self, **kwargs):
        """cancel the named ownership offer."""
        return await self.request('POST', '/events/{eventId}/ownership-transfer/cancel', **kwargs)

    async def read_viewer_safe_event_logistics_before_joining(self, **kwargs):
        """Read viewer-safe event logistics before joining."""
        return await self.request('GET', '/events/{eventId}/logistics', **kwargs)

    def discover_friends_and_group_events_items(self, **kwargs):
        return self.iterate('/events/discover', adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, **kwargs)

    async def discover_friends_and_group_events(self, **kwargs):
        """Discover Friends and Group events."""
        return await self.request('GET', '/events/discover', **kwargs)

    async def join_a_discoverable_event(self, **kwargs):
        """Join a discoverable event."""
        return await self.request('POST', '/events/{eventId}/join', **kwargs)

    async def read_event_visibility_admission_and_permissions(self, **kwargs):
        """Read event visibility, admission and permissions."""
        return await self.request('GET', '/events/{eventId}/settings', **kwargs)

    async def update_event_visibility_admission_and_permissions(self, **kwargs):
        """Update event visibility, admission and permissions."""
        return await self.request('PATCH', '/events/{eventId}/settings', **kwargs)

    async def read_event_lifecycle(self, **kwargs):
        """Read Organizer lifecycle and revision."""
        return await self.request('GET', '/events/{eventId}/lifecycle', **kwargs)

    async def update_event_lifecycle(self, **kwargs):
        """Complete, reopen or reschedule as current Organizer."""
        return await self.request('POST', '/events/{eventId}/lifecycle', **kwargs)

    async def get_events_event_id_applications_form(self, **kwargs):
        """."""
        return await self.request('GET', '/events/{eventId}/applications/form', **kwargs)

    def get_events_event_id_applications_history_items(self, **kwargs):
        return self.iterate('/events/{eventId}/applications/history', adapter={'items': 'page', 'cursor': 'continueCursor', 'done': 'isDone'}, **kwargs)

    async def get_events_event_id_applications_history(self, **kwargs):
        """."""
        return await self.request('GET', '/events/{eventId}/applications/history', **kwargs)

    def get_events_event_id_applications_list_items(self, **kwargs):
        return self.iterate('/events/{eventId}/applications/list', adapter={'items': 'page', 'cursor': 'continueCursor', 'done': 'isDone'}, **kwargs)

    async def get_events_event_id_applications_list(self, **kwargs):
        """."""
        return await self.request('GET', '/events/{eventId}/applications/list', **kwargs)

    async def put_events_event_id_applications_settings(self, **kwargs):
        """."""
        return await self.request('PUT', '/events/{eventId}/applications/settings', **kwargs)

    async def post_events_event_id_applications(self, **kwargs):
        """."""
        return await self.request('POST', '/events/{eventId}/applications', **kwargs)

    async def post_event_applications_application_id_withdraw(self, **kwargs):
        """."""
        return await self.request('POST', '/event-applications/{applicationId}/withdraw', **kwargs)

    async def post_event_applications_application_id_decision(self, **kwargs):
        """."""
        return await self.request('POST', '/event-applications/{applicationId}/decision', **kwargs)

    def list_events_items(self, **kwargs):
        return self.iterate('/events', adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, **kwargs)

    async def list_events(self, **kwargs):
        """List events."""
        return await self.request('GET', '/events', **kwargs)

    async def create_event(self, **kwargs):
        """Create event."""
        return await self.request('POST', '/events', **kwargs)

    async def get_event(self, **kwargs):
        """Get event."""
        return await self.request('GET', '/events/{eventId}', **kwargs)

    async def update_event(self, **kwargs):
        """Update event."""
        return await self.request('PATCH', '/events/{eventId}', **kwargs)

    async def delete_event(self, **kwargs):
        """Delete event."""
        return await self.request('DELETE', '/events/{eventId}', **kwargs)

    async def inspect_current_account_avatar(self, **kwargs):
        """Inspect current account avatar."""
        return await self.request('GET', '/profile/avatar', **kwargs)

    async def replace_current_account_avatar(self, **kwargs):
        """Replace current account avatar."""
        return await self.request('PUT', '/profile/avatar', **kwargs)

    async def remove_current_account_avatar(self, **kwargs):
        """Remove current account avatar."""
        return await self.request('DELETE', '/profile/avatar', **kwargs)

    async def inspect_event_cover(self, **kwargs):
        """Inspect event cover."""
        return await self.request('GET', '/events/{eventId}/cover', **kwargs)

    async def replace_event_cover(self, **kwargs):
        """Replace event cover."""
        return await self.request('PUT', '/events/{eventId}/cover', **kwargs)

    async def remove_event_cover(self, **kwargs):
        """Remove event cover."""
        return await self.request('DELETE', '/events/{eventId}/cover', **kwargs)

    def list_posts_items(self, **kwargs):
        return self.iterate('/events/{parentId}/posts', adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, **kwargs)

    async def list_posts(self, **kwargs):
        """."""
        return await self.request('GET', '/events/{parentId}/posts', **kwargs)

    async def get_post(self, **kwargs):
        """."""
        return await self.request('GET', '/posts/{id}', **kwargs)

    async def update_post(self, **kwargs):
        """."""
        return await self.request('PATCH', '/posts/{id}', **kwargs)

    async def delete_post(self, **kwargs):
        """."""
        return await self.request('DELETE', '/posts/{id}', **kwargs)

    async def create_post(self, **kwargs):
        """."""
        return await self.request('POST', '/events/{id}/posts', **kwargs)

    def list_replies_items(self, **kwargs):
        return self.iterate('/posts/{parentId}/replies', adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, **kwargs)

    async def list_replies(self, **kwargs):
        """."""
        return await self.request('GET', '/posts/{parentId}/replies', **kwargs)

    async def get_reply(self, **kwargs):
        """."""
        return await self.request('GET', '/replies/{id}', **kwargs)

    async def update_reply(self, **kwargs):
        """."""
        return await self.request('PATCH', '/replies/{id}', **kwargs)

    async def delete_reply(self, **kwargs):
        """."""
        return await self.request('DELETE', '/replies/{id}', **kwargs)

    async def create_reply(self, **kwargs):
        """."""
        return await self.request('POST', '/posts/{id}/replies', **kwargs)

    def list_members_items(self, **kwargs):
        return self.iterate('/events/{eventId}/members', adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, **kwargs)

    async def list_members(self, **kwargs):
        """List members."""
        return await self.request('GET', '/events/{eventId}/members', **kwargs)

    async def update_member_role(self, **kwargs):
        """Update member role."""
        return await self.request('PATCH', '/events/{eventId}/members/{memberId}', **kwargs)

    async def remove_member(self, **kwargs):
        """Remove member."""
        return await self.request('DELETE', '/events/{eventId}/members/{memberId}', **kwargs)

    async def leave_event(self, **kwargs):
        """Leave event."""
        return await self.request('POST', '/events/{eventId}/leave', **kwargs)

    async def update_r_s_v_p(self, **kwargs):
        """Update RSVP."""
        return await self.request('PATCH', '/events/{eventId}/rsvp', **kwargs)

    async def read_your_r_s_v_p(self, **kwargs):
        """Read your RSVP."""
        return await self.request('GET', '/events/{eventId}/rsvp', **kwargs)

    async def read_availability_grid(self, **kwargs):
        """Read availability grid."""
        return await self.request('GET', '/events/{eventId}/availability', **kwargs)

    async def submit_availability(self, **kwargs):
        """Submit availability."""
        return await self.request('POST', '/events/{eventId}/availability', **kwargs)

    async def clear_your_availability(self, **kwargs):
        """Clear your availability."""
        return await self.request('DELETE', '/events/{eventId}/availability', **kwargs)

    def list_potential_dates_items(self, **kwargs):
        return self.iterate('/events/{eventId}/potential-dates', adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, **kwargs)

    async def list_potential_dates(self, **kwargs):
        """List potential dates."""
        return await self.request('GET', '/events/{eventId}/potential-dates', **kwargs)

    def read_your_availability_items(self, **kwargs):
        return self.iterate('/events/{eventId}/availability/mine', adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, **kwargs)

    async def read_your_availability(self, **kwargs):
        """Read your availability."""
        return await self.request('GET', '/events/{eventId}/availability/mine', **kwargs)

    def list_availability_responses_items(self, **kwargs):
        return self.iterate('/events/{eventId}/availability/responses', adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, **kwargs)

    async def list_availability_responses(self, **kwargs):
        """List availability responses."""
        return await self.request('GET', '/events/{eventId}/availability/responses', **kwargs)

    async def choose_event_date(self, **kwargs):
        """Choose event date."""
        return await self.request('POST', '/events/{eventId}/date', **kwargs)

    async def reset_event_date(self, **kwargs):
        """Reset event date."""
        return await self.request('DELETE', '/events/{eventId}/date', **kwargs)

    def list_friends_items(self, **kwargs):
        return self.iterate('/friends', adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, **kwargs)

    async def list_friends(self, **kwargs):
        """List friends."""
        return await self.request('GET', '/friends', **kwargs)

    def list_incoming_requests_items(self, **kwargs):
        return self.iterate('/friends/requests/incoming', adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, **kwargs)

    async def list_incoming_requests(self, **kwargs):
        """List incoming requests."""
        return await self.request('GET', '/friends/requests/incoming', **kwargs)

    def list_outgoing_requests_items(self, **kwargs):
        return self.iterate('/friends/requests/outgoing', adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, **kwargs)

    async def list_outgoing_requests(self, **kwargs):
        """List outgoing requests."""
        return await self.request('GET', '/friends/requests/outgoing', **kwargs)

    async def search_users(self, **kwargs):
        """Search users."""
        return await self.request('GET', '/friends/search', **kwargs)

    async def get_friendship_status(self, **kwargs):
        """Get friendship status."""
        return await self.request('GET', '/friends/status/{targetPersonId}', **kwargs)

    async def send_friend_request(self, **kwargs):
        """Send friend request."""
        return await self.request('POST', '/friends/requests', **kwargs)

    async def accept_friend_request(self, **kwargs):
        """Accept friend request."""
        return await self.request('POST', '/friends/requests/{friendshipId}/accept', **kwargs)

    async def decline_friend_request(self, **kwargs):
        """Decline friend request."""
        return await self.request('POST', '/friends/requests/{friendshipId}/decline', **kwargs)

    async def cancel_friend_request(self, **kwargs):
        """Cancel friend request."""
        return await self.request('DELETE', '/friends/requests/{friendshipId}', **kwargs)

    async def remove_friend(self, **kwargs):
        """Remove friend."""
        return await self.request('DELETE', '/friends/{friendshipId}', **kwargs)

    async def explicitly_announce_to_permitted_group_members(self, **kwargs):
        """Explicitly announce to permitted Group members."""
        return await self.request('POST', '/groups/{groupId}/announcements', **kwargs)

    async def recover_your_explicit_announcement_request_status(self, **kwargs):
        """Recover your explicit announcement request status."""
        return await self.request('GET', '/groups/{groupId}/announcements/status', **kwargs)

    def list_persistent_group_lists_items(self, **kwargs):
        return self.iterate('/groups/{groupId}/lists', adapter={'items': 'page', 'cursor': 'continueCursor', 'done': 'isDone'}, **kwargs)

    async def list_persistent_group_lists(self, **kwargs):
        """list persistent Group lists."""
        return await self.request('GET', '/groups/{groupId}/lists', **kwargs)

    async def create_persistent_group_list(self, **kwargs):
        """create persistent Group list."""
        return await self.request('POST', '/groups/{groupId}/lists', **kwargs)

    async def get_persistent_group_lists(self, **kwargs):
        """get persistent Group lists."""
        return await self.request('GET', '/groups/{groupId}/lists/{toolId}', **kwargs)

    async def configure_persistent_group_list(self, **kwargs):
        """configure persistent Group list."""
        return await self.request('PATCH', '/groups/{groupId}/lists/{toolId}', **kwargs)

    async def remove_persistent_group_list(self, **kwargs):
        """remove persistent Group list."""
        return await self.request('DELETE', '/groups/{groupId}/lists/{toolId}', **kwargs)

    async def settings_persistent_group_lists(self, **kwargs):
        """settings persistent Group lists."""
        return await self.request('GET', '/groups/{groupId}/lists/{toolId}/settings', **kwargs)

    def entries_persistent_group_lists_items(self, **kwargs):
        return self.iterate('/groups/{groupId}/lists/{toolId}/entries', adapter={'items': 'page', 'cursor': 'continueCursor', 'done': 'isDone'}, **kwargs)

    async def entries_persistent_group_lists(self, **kwargs):
        """entries persistent Group lists."""
        return await self.request('GET', '/groups/{groupId}/lists/{toolId}/entries', **kwargs)

    async def add_persistent_group_list(self, **kwargs):
        """add persistent Group list."""
        return await self.request('POST', '/groups/{groupId}/lists/{toolId}/entries', **kwargs)

    def own_persistent_group_lists_items(self, **kwargs):
        return self.iterate('/groups/{groupId}/lists/{toolId}/own', adapter={'items': 'page', 'cursor': 'continueCursor', 'done': 'isDone'}, **kwargs)

    async def own_persistent_group_lists(self, **kwargs):
        """own persistent Group lists."""
        return await self.request('GET', '/groups/{groupId}/lists/{toolId}/own', **kwargs)

    async def edit_persistent_group_list(self, **kwargs):
        """edit persistent Group list."""
        return await self.request('PATCH', '/groups/{groupId}/lists/{toolId}/entries/{entryId}', **kwargs)

    async def removeentry_persistent_group_list(self, **kwargs):
        """removeEntry persistent Group list."""
        return await self.request('DELETE', '/groups/{groupId}/lists/{toolId}/entries/{entryId}', **kwargs)

    async def read_owner_list_availability_and_creation_policy(self, **kwargs):
        """Read owner list availability and creation policy."""
        return await self.request('GET', '/groups/{groupId}/list-policy', **kwargs)

    async def owner_configures_list_availability_and_creation(self, **kwargs):
        """Owner configures list availability and creation."""
        return await self.request('PUT', '/groups/{groupId}/list-policy', **kwargs)

    async def create_an_independent_persistent_ordinary_form(self, **kwargs):
        """Create an independent persistent ordinary form."""
        return await self.request('POST', '/groups/{groupId}/forms', **kwargs)

    def list_ordinary_forms_independently_of_the_joining_questionnaire_items(self, **kwargs):
        return self.iterate('/groups/{groupId}/forms', adapter={'items': 'page', 'cursor': 'continueCursor', 'done': 'isDone'}, **kwargs)

    async def list_ordinary_forms_independently_of_the_joining_questionnaire(self, **kwargs):
        """List ordinary forms independently of the joining questionnaire."""
        return await self.request('GET', '/groups/{groupId}/forms', **kwargs)

    async def get_groups_forms_settings(self, **kwargs):
        """Read preserved form configuration as a current eligible manager, including while disabled."""
        return await self.request('GET', '/groups/{groupId}/forms/{toolId}/settings', **kwargs)

    async def read_current_form_and_your_compatible_answers(self, **kwargs):
        """Read current form and your compatible answers."""
        return await self.request('GET', '/groups/{groupId}/forms/{toolId}', **kwargs)

    async def patch_groups_forms(self, **kwargs):
        """Manage current form configuration without erasing saved definitions."""
        return await self.request('PATCH', '/groups/{groupId}/forms/{toolId}', **kwargs)

    async def explicitly_delete_form_and_all_responses(self, **kwargs):
        """Explicitly delete form and all responses."""
        return await self.request('DELETE', '/groups/{groupId}/forms/{toolId}', **kwargs)

    def read_only_your_retained_response_snapshots_items(self, **kwargs):
        return self.iterate('/groups/{groupId}/forms/{toolId}/history', adapter={'items': 'page', 'cursor': 'continueCursor', 'done': 'isDone'}, **kwargs)

    async def read_only_your_retained_response_snapshots(self, **kwargs):
        """Read only your retained response snapshots."""
        return await self.request('GET', '/groups/{groupId}/forms/{toolId}/history', **kwargs)

    def read_stated_visibility_latest_responses_items(self, **kwargs):
        return self.iterate('/groups/{groupId}/forms/{toolId}/results', adapter={'items': 'page', 'cursor': 'continueCursor', 'done': 'isDone'}, **kwargs)

    async def read_stated_visibility_latest_responses(self, **kwargs):
        """Read stated-visibility latest responses."""
        return await self.request('GET', '/groups/{groupId}/forms/{toolId}/results', **kwargs)

    async def put_groups_forms_response(self, **kwargs):
        """Submit or edit your validated response using current form and response revisions."""
        return await self.request('PUT', '/groups/{groupId}/forms/{toolId}/response', **kwargs)

    async def remove_your_response_and_private_retained_history(self, **kwargs):
        """Remove your response and private retained history."""
        return await self.request('DELETE', '/groups/{groupId}/forms/{toolId}/response', **kwargs)

    async def delete_groups_forms_results(self, **kwargs):
        """Moderate a current ordinary response including anonymous shared content."""
        return await self.request('DELETE', '/groups/{groupId}/forms/{toolId}/results/{responseId}', **kwargs)

    async def read_form_availability_creation_policy(self, **kwargs):
        """Read form availability/creation policy."""
        return await self.request('GET', '/groups/{groupId}/form-policy', **kwargs)

    async def owner_controls_form_availability_and_creation(self, **kwargs):
        """Owner controls form availability and creation."""
        return await self.request('PUT', '/groups/{groupId}/form-policy', **kwargs)

    async def create_an_independent_persistent_persistent_poll(self, **kwargs):
        """Create an independent persistent persistent poll."""
        return await self.request('POST', '/groups/{groupId}/polls', **kwargs)

    def get_groups_polls_items(self, **kwargs):
        return self.iterate('/groups/{groupId}/polls', adapter={'items': 'page', 'cursor': 'continueCursor', 'done': 'isDone'}, **kwargs)

    async def get_groups_polls(self, **kwargs):
        """List persistent polls independently of the joining questionnaire."""
        return await self.request('GET', '/groups/{groupId}/polls', **kwargs)

    async def get_groups_polls_settings(self, **kwargs):
        """Read preserved poll configuration as a current eligible manager, including while disabled."""
        return await self.request('GET', '/groups/{groupId}/polls/{toolId}/settings', **kwargs)

    async def read_current_poll_and_your_compatible_selections(self, **kwargs):
        """Read current poll and your compatible selections."""
        return await self.request('GET', '/groups/{groupId}/polls/{toolId}', **kwargs)

    async def patch_groups_polls(self, **kwargs):
        """Manage current poll configuration without erasing saved definitions."""
        return await self.request('PATCH', '/groups/{groupId}/polls/{toolId}', **kwargs)

    async def delete_a_poll_and_all_votes_as_a_current_eligible_manager(self, **kwargs):
        """Delete a poll and all votes as a current eligible manager."""
        return await self.request('DELETE', '/groups/{groupId}/polls/{toolId}', **kwargs)

    def read_only_your_retained_vote_snapshots_items(self, **kwargs):
        return self.iterate('/groups/{groupId}/polls/{toolId}/history', adapter={'items': 'page', 'cursor': 'continueCursor', 'done': 'isDone'}, **kwargs)

    async def read_only_your_retained_vote_snapshots(self, **kwargs):
        """Read only your retained vote snapshots."""
        return await self.request('GET', '/groups/{groupId}/polls/{toolId}/history', **kwargs)

    def read_stated_visibility_latest_votes_items(self, **kwargs):
        return self.iterate('/groups/{groupId}/polls/{toolId}/results', adapter={'items': 'page', 'cursor': 'continueCursor', 'done': 'isDone'}, **kwargs)

    async def read_stated_visibility_latest_votes(self, **kwargs):
        """Read stated-visibility latest votes."""
        return await self.request('GET', '/groups/{groupId}/polls/{toolId}/results', **kwargs)

    async def put_groups_polls_vote(self, **kwargs):
        """Submit or edit your validated vote using current poll and vote revisions."""
        return await self.request('PUT', '/groups/{groupId}/polls/{toolId}/vote', **kwargs)

    async def remove_your_vote_and_private_history_using_optimistic_revision(self, **kwargs):
        """Remove your vote and private history using optimistic revision."""
        return await self.request('DELETE', '/groups/{groupId}/polls/{toolId}/vote', **kwargs)

    async def delete_groups_polls_results(self, **kwargs):
        """Moderate a current ordinary vote including anonymous shared content."""
        return await self.request('DELETE', '/groups/{groupId}/polls/{toolId}/results/{voteId}', **kwargs)

    async def read_poll_availability_creation_policy(self, **kwargs):
        """Read poll availability/creation policy."""
        return await self.request('GET', '/groups/{groupId}/poll-policy', **kwargs)

    async def owner_controls_poll_availability_and_creation(self, **kwargs):
        """Owner controls poll availability and creation."""
        return await self.request('PUT', '/groups/{groupId}/poll-policy', **kwargs)

    async def expel_community_member(self, **kwargs):
        """Commit coordinated community exclusion as staff."""
        return await self.request('POST', '/groups/{groupId}/coordinated-expulsions', **kwargs)

    async def read_community_expulsion(self, **kwargs):
        """Reconcile coordinated exclusion progress as current staff."""
        return await self.request('GET', '/groups/{groupId}/coordinated-expulsions/{personId}', **kwargs)

    async def resume_community_expulsion(self, **kwargs):
        """Resume cleanup with current independent Event authority."""
        return await self.request('POST', '/groups/{groupId}/coordinated-expulsions/{personId}/resume', **kwargs)

    async def reinstate_community_member(self, **kwargs):
        """Reinstate after complete cleanup without restoring admission."""
        return await self.request('POST', '/groups/{groupId}/coordinated-expulsions/{personId}/reinstate', **kwargs)

    def list_your_groups_items(self, **kwargs):
        return self.iterate('/groups', adapter={'items': 'items', 'cursor': 'nextCursor'}, **kwargs)

    async def list_your_groups(self, **kwargs):
        """List your Groups."""
        return await self.request('GET', '/groups', **kwargs)

    async def create_an_owner_only_group(self, **kwargs):
        """Create an owner-only Group."""
        return await self.request('POST', '/groups', **kwargs)

    async def read_an_admitted_group(self, **kwargs):
        """Read an admitted Group."""
        return await self.request('GET', '/groups/{groupId}', **kwargs)

    async def update_group_identity_as_owner(self, **kwargs):
        """Update Group identity as owner."""
        return await self.request('PATCH', '/groups/{groupId}', **kwargs)

    async def explicitly_delete_a_group_as_owner(self, **kwargs):
        """Explicitly delete a Group as owner."""
        return await self.request('DELETE', '/groups/{groupId}', **kwargs)

    async def read_own_community_context(self, **kwargs):
        """Read own community context."""
        return await self.request('GET', '/groups/{groupId}/community-context', **kwargs)

    async def read_current_community_event(self, **kwargs):
        """Read the single current selected Group Event."""
        return await self.request('GET', '/groups/{groupId}/current-event', **kwargs)

    async def join_community_event(self, **kwargs):
        """joinCommunityEvent."""
        return await self.request('POST', '/groups/{groupId}/events/{eventId}/join', **kwargs)

    async def set_community_rsvp(self, **kwargs):
        """setCommunityRsvp."""
        return await self.request('PUT', '/groups/{groupId}/events/{eventId}/own-rsvp', **kwargs)

    async def leave_community_event(self, **kwargs):
        """leaveCommunityEvent."""
        return await self.request('POST', '/groups/{groupId}/events/{eventId}/leave', **kwargs)

    async def leave_community(self, **kwargs):
        """leaveCommunity."""
        return await self.request('POST', '/groups/{groupId}/community-leave', **kwargs)

    async def submit_community_application(self, **kwargs):
        """submitCommunityApplication."""
        return await self.request('POST', '/groups/{groupId}/community-applications', **kwargs)

    async def edit_community_application(self, **kwargs):
        """editCommunityApplication."""
        return await self.request('PATCH', '/groups/{groupId}/community-applications/{applicationId}', **kwargs)

    async def withdraw_community_application(self, **kwargs):
        """withdrawCommunityApplication."""
        return await self.request('POST', '/groups/{groupId}/community-applications/{applicationId}/withdraw', **kwargs)

    async def set_community_announcement_preference(self, **kwargs):
        """Change own Group announcement subscription."""
        return await self.request('PUT', '/groups/{groupId}/announcement-preference', **kwargs)

    async def read_own_group_discord_status(self, **kwargs):
        """Read own selected Group Discord access and Open Discord destination."""
        return await self.request('GET', '/groups/{groupId}/discord', **kwargs)

    async def begin_own_group_discord_connect(self, **kwargs):
        """Begin a Groupi-hosted member identity and consent journey."""
        return await self.request('POST', '/groups/{groupId}/discord/connect', **kwargs)

    async def get_groups_joining_questionnaire(self, **kwargs):
        """Read your private joining questionnaire and current access status."""
        return await self.request('GET', '/groups/{groupId}/joining-questionnaire', **kwargs)

    async def put_groups_joining_questionnaire(self, **kwargs):
        """Configure the joining questionnaire and completion policy as Group owner."""
        return await self.request('PUT', '/groups/{groupId}/joining-questionnaire', **kwargs)

    async def submit_or_edit_private_answers_as_an_admitted_member(self, **kwargs):
        """Submit or edit private answers as an admitted member."""
        return await self.request('PUT', '/groups/{groupId}/joining-questionnaire/answers', **kwargs)

    def review_private_answers_as_current_owner_or_moderator_items(self, **kwargs):
        return self.iterate('/groups/{groupId}/joining-questionnaire/responses', adapter={'items': 'items', 'cursor': 'nextCursor'}, **kwargs)

    async def review_private_answers_as_current_owner_or_moderator(self, **kwargs):
        """Review private answers as current owner or moderator."""
        return await self.request('GET', '/groups/{groupId}/joining-questionnaire/responses', **kwargs)

    def get_groups_joining_questionnaire_history_items(self, **kwargs):
        return self.iterate('/groups/{groupId}/joining-questionnaire/history', adapter={'items': 'items', 'cursor': 'nextCursor'}, **kwargs)

    async def get_groups_joining_questionnaire_history(self, **kwargs):
        """Read own retained answer history or review an author as current manager."""
        return await self.request('GET', '/groups/{groupId}/joining-questionnaire/history', **kwargs)

    def list_your_private_group_invitations_items(self, **kwargs):
        return self.iterate('/group-invites', adapter={'items': 'items', 'cursor': 'nextCursor'}, **kwargs)

    async def list_your_private_group_invitations(self, **kwargs):
        """List your private Group invitations."""
        return await self.request('GET', '/group-invites', **kwargs)

    def list_group_invitations_as_manager_items(self, **kwargs):
        return self.iterate('/groups/{groupId}/invitations', adapter={'items': 'items', 'cursor': 'nextCursor'}, **kwargs)

    async def list_group_invitations_as_manager(self, **kwargs):
        """List Group invitations as manager."""
        return await self.request('GET', '/groups/{groupId}/invitations', **kwargs)

    async def invite_an_existing_user_as_group_owner(self, **kwargs):
        """Invite an existing user as Group owner."""
        return await self.request('POST', '/groups/{groupId}/invitations', **kwargs)

    def read_admitted_group_roster_items(self, **kwargs):
        return self.iterate('/groups/{groupId}/members', adapter={'items': 'items', 'cursor': 'nextCursor'}, **kwargs)

    async def read_admitted_group_roster(self, **kwargs):
        """Read admitted Group roster."""
        return await self.request('GET', '/groups/{groupId}/members', **kwargs)

    async def configure_group_invitations_as_owner(self, **kwargs):
        """Configure Group invitations as owner."""
        return await self.request('PATCH', '/groups/{groupId}/invitation-policy', **kwargs)

    async def accept_your_group_invitation(self, **kwargs):
        """Accept your Group invitation."""
        return await self.request('POST', '/group-invites/{inviteId}/accept', **kwargs)

    async def decline_your_group_invitation(self, **kwargs):
        """Decline your Group invitation."""
        return await self.request('POST', '/group-invites/{inviteId}/decline', **kwargs)

    async def cancel_a_pending_invitation_as_group_manager(self, **kwargs):
        """Cancel a pending invitation as Group manager."""
        return await self.request('POST', '/group-invites/{inviteId}/cancel', **kwargs)

    def list_active_group_bans_as_manager_items(self, **kwargs):
        return self.iterate('/groups/{groupId}/bans', adapter={'items': 'items', 'cursor': 'nextCursor'}, **kwargs)

    async def list_active_group_bans_as_manager(self, **kwargs):
        """List active Group bans as manager."""
        return await self.request('GET', '/groups/{groupId}/bans', **kwargs)

    async def appoint_or_demote_a_group_moderator_as_owner(self, **kwargs):
        """Appoint or demote a Group moderator as owner."""
        return await self.request('PATCH', '/groups/{groupId}/members/{personId}/role', **kwargs)

    async def remove_an_ordinary_member_without_banning(self, **kwargs):
        """Remove an ordinary member without banning."""
        return await self.request('DELETE', '/groups/{groupId}/members/{personId}', **kwargs)

    async def ban_an_ordinary_member_or_nonmember(self, **kwargs):
        """Ban an ordinary member or nonmember."""
        return await self.request('PUT', '/groups/{groupId}/bans/{personId}', **kwargs)

    async def lift_a_group_ban_without_admitting_membership(self, **kwargs):
        """Lift a Group ban without admitting membership."""
        return await self.request('DELETE', '/groups/{groupId}/bans/{personId}', **kwargs)

    async def leave_your_own_group_membership(self, **kwargs):
        """Leave your own Group membership."""
        return await self.request('POST', '/groups/{groupId}/leave', **kwargs)

    async def read_private_participant_ownership_offer_status(self, **kwargs):
        """Read private participant ownership offer status."""
        return await self.request('GET', '/groups/{groupId}/ownership-transfer', **kwargs)

    async def offer_group_responsibility_to_an_admitted_member(self, **kwargs):
        """Offer Group responsibility to an admitted member."""
        return await self.request('POST', '/groups/{groupId}/ownership-transfer', **kwargs)

    async def accept_the_observed_ownership_offer(self, **kwargs):
        """accept the observed ownership offer."""
        return await self.request('POST', '/groups/{groupId}/ownership-transfer/accept', **kwargs)

    async def decline_the_observed_ownership_offer(self, **kwargs):
        """decline the observed ownership offer."""
        return await self.request('POST', '/groups/{groupId}/ownership-transfer/decline', **kwargs)

    async def cancel_the_observed_ownership_offer(self, **kwargs):
        """cancel the observed ownership offer."""
        return await self.request('POST', '/groups/{groupId}/ownership-transfer/cancel', **kwargs)

    async def read_admission_questions_and_your_private_pending_application(self, **kwargs):
        """Read admission questions and your private pending application."""
        return await self.request('GET', '/groups/{groupId}/application-form', **kwargs)

    async def configure_group_applications_as_owner(self, **kwargs):
        """Configure Group applications as owner."""
        return await self.request('PUT', '/groups/{groupId}/application-settings', **kwargs)

    def read_your_retained_private_group_application_history_items(self, **kwargs):
        return self.iterate('/groups/{groupId}/applications/mine', adapter={'items': 'items', 'cursor': 'nextCursor'}, **kwargs)

    async def read_your_retained_private_group_application_history(self, **kwargs):
        """Read your retained private Group application history."""
        return await self.request('GET', '/groups/{groupId}/applications/mine', **kwargs)

    def review_private_group_application_queue_as_manager_items(self, **kwargs):
        return self.iterate('/groups/{groupId}/applications', adapter={'items': 'items', 'cursor': 'nextCursor'}, **kwargs)

    async def review_private_group_application_queue_as_manager(self, **kwargs):
        """Review private Group application queue as manager."""
        return await self.request('GET', '/groups/{groupId}/applications', **kwargs)

    async def submit_or_edit_your_pending_admission_application(self, **kwargs):
        """Submit or edit your pending admission application."""
        return await self.request('POST', '/groups/{groupId}/applications', **kwargs)

    async def read_a_private_application_as_its_author_or_current_manager(self, **kwargs):
        """Read a private application as its author or current manager."""
        return await self.request('GET', '/groups/{groupId}/applications/{applicationId}', **kwargs)

    async def edit_your_pending_answers_against_saved_question_definitions(self, **kwargs):
        """Edit your pending answers against saved question definitions."""
        return await self.request('PATCH', '/groups/{groupId}/applications/{applicationId}', **kwargs)

    async def withdraw_your_pending_application_without_deleting_history(self, **kwargs):
        """Withdraw your pending application without deleting history."""
        return await self.request('POST', '/groups/{groupId}/applications/{applicationId}/withdraw', **kwargs)

    async def approve_or_decline_an_application_as_current_group_manager(self, **kwargs):
        """Approve or decline an application as current Group manager."""
        return await self.request('POST', '/groups/{groupId}/applications/{applicationId}/review', **kwargs)

    async def get_events_audiences(self, **kwargs):
        """Read only viewer-visible Group associations and Organizer Friends setting."""
        return await self.request('GET', '/events/{eventId}/audiences', **kwargs)

    async def set_independent_friends_audience_as_current_organizer(self, **kwargs):
        """Set independent Friends audience as current Organizer."""
        return await self.request('PUT', '/events/{eventId}/audiences/friends', **kwargs)

    async def configure_whole_group_event_sharing_as_owner(self, **kwargs):
        """Configure whole-Group Event sharing as owner."""
        return await self.request('PUT', '/groups/{groupId}/event-sharing', **kwargs)

    async def share_with_a_whole_group_with_both_permissions(self, **kwargs):
        """Share with a whole Group with both permissions."""
        return await self.request('POST', '/events/{eventId}/audiences/groups/{groupId}', **kwargs)

    async def withdraw_one_group_grant_without_affecting_other_audiences(self, **kwargs):
        """Withdraw one Group grant without affecting other audiences."""
        return await self.request('DELETE', '/events/{eventId}/audiences/groups/{groupId}', **kwargs)

    async def delete_groups_events(self, **kwargs):
        """Withdraw this Group grant as current Group manager; conveys no Event authority."""
        return await self.request('DELETE', '/groups/{groupId}/events/{eventId}', **kwargs)

    def get_groups_events_items(self, **kwargs):
        return self.iterate('/groups/{groupId}/events', adapter={'items': 'items', 'cursor': 'nextCursor'}, **kwargs)

    async def get_groups_events(self, **kwargs):
        """Read safe upcoming/undated Group Event previews in bounded association-order pages."""
        return await self.request('GET', '/groups/{groupId}/events', **kwargs)

    def list_blocked_users_bounded_cursor_pages_items(self, **kwargs):
        return self.iterate('/blocks', adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, **kwargs)

    async def list_blocked_users_bounded_cursor_pages(self, **kwargs):
        """List blocked users (bounded cursor pages)."""
        return await self.request('GET', '/blocks', **kwargs)

    async def inspect_block_relationship(self, **kwargs):
        """Inspect block relationship."""
        return await self.request('GET', '/blocks/{personId}', **kwargs)

    async def block_user_and_remove_friendships_requests(self, **kwargs):
        """Block user and remove friendships/requests."""
        return await self.request('POST', '/blocks/{personId}', **kwargs)

    async def unblock_user(self, **kwargs):
        """Unblock user."""
        return await self.request('DELETE', '/blocks/{personId}', **kwargs)

    def list_your_existing_published_custom_templates_items(self, **kwargs):
        return self.iterate('/addon-templates', adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, **kwargs)

    async def list_your_existing_published_custom_templates(self, **kwargs):
        """List your existing published custom templates."""
        return await self.request('GET', '/addon-templates', **kwargs)

    async def post_events_addons_participation(self, **kwargs):
        """Perform an app-supported participant action as the current identity."""
        return await self.request('POST', '/events/{eventId}/addons/{addonType}/participation', **kwargs)

    def list_add_ons_items(self, **kwargs):
        return self.iterate('/events/{eventId}/addons', adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, **kwargs)

    async def list_add_ons(self, **kwargs):
        """List add-ons."""
        return await self.request('GET', '/events/{eventId}/addons', **kwargs)

    async def enable_add_on(self, **kwargs):
        """Enable add-on."""
        return await self.request('POST', '/events/{eventId}/addons/{addonType}/enable', **kwargs)

    async def disable_add_on(self, **kwargs):
        """Disable add-on."""
        return await self.request('POST', '/events/{eventId}/addons/{addonType}/disable', **kwargs)

    async def update_add_on_config(self, **kwargs):
        """Update add-on config."""
        return await self.request('PATCH', '/events/{eventId}/addons/{addonType}/config', **kwargs)

    def list_add_on_data_items(self, **kwargs):
        return self.iterate('/events/{eventId}/addons/{addonType}/data', adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, **kwargs)

    async def list_add_on_data(self, **kwargs):
        """List add-on data."""
        return await self.request('GET', '/events/{eventId}/addons/{addonType}/data', **kwargs)

    async def set_add_on_data(self, **kwargs):
        """Set add-on data."""
        return await self.request('PUT', '/events/{eventId}/addons/{addonType}/data/{key}', **kwargs)

    async def delete_add_on_data(self, **kwargs):
        """Delete add-on data."""
        return await self.request('DELETE', '/events/{eventId}/addons/{addonType}/data/{key}', **kwargs)

    def list_owned_draft_and_published_definitions_items(self, **kwargs):
        return self.iterate('/addon-template-definitions', adapter={'items': 'items', 'cursor': 'nextCursor'}, **kwargs)

    async def list_owned_draft_and_published_definitions(self, **kwargs):
        """List owned draft and published definitions."""
        return await self.request('GET', '/addon-template-definitions', **kwargs)

    async def create_a_complete_definition_as_a_draft(self, **kwargs):
        """Create a complete definition as a draft."""
        return await self.request('POST', '/addon-template-definitions', **kwargs)

    async def read_an_owned_definition(self, **kwargs):
        """Read an owned definition."""
        return await self.request('GET', '/addon-template-definitions/{id}', **kwargs)

    async def replace_an_owned_definition_at_the_expected_version(self, **kwargs):
        """Replace an owned definition at the expected version."""
        return await self.request('PATCH', '/addon-template-definitions/{id}', **kwargs)

    async def delete_addon_template_definitions(self, **kwargs):
        """Delete an owned definition without changing enabled event snapshots."""
        return await self.request('DELETE', '/addon-template-definitions/{id}', **kwargs)

    async def publish_an_owned_definition(self, **kwargs):
        """publish an owned definition."""
        return await self.request('POST', '/addon-template-definitions/{id}/publish', **kwargs)

    async def unpublish_an_owned_definition(self, **kwargs):
        """unpublish an owned definition."""
        return await self.request('POST', '/addon-template-definitions/{id}/unpublish', **kwargs)

    def list_cached_authorized_discord_guilds_for_this_identity_items(self, **kwargs):
        return self.iterate('/discord/guilds', adapter={'items': 'items', 'cursor': 'nextCursor'}, **kwargs)

    async def list_cached_authorized_discord_guilds_for_this_identity(self, **kwargs):
        """List cached authorized Discord guilds for this identity."""
        return await self.request('GET', '/discord/guilds', **kwargs)

    async def refresh_this_identity_s_discord_guild_authorization_cache(self, **kwargs):
        """Refresh this identity’s Discord guild authorization cache."""
        return await self.request('POST', '/discord/guilds/refresh', **kwargs)

    def list_notifications_items(self, **kwargs):
        return self.iterate('/notifications', adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, **kwargs)

    async def list_notifications(self, **kwargs):
        """List notifications."""
        return await self.request('GET', '/notifications', **kwargs)

    async def delete_all_notifications(self, **kwargs):
        """Delete all notifications."""
        return await self.request('DELETE', '/notifications', **kwargs)

    async def get_unread_count(self, **kwargs):
        """Get unread count."""
        return await self.request('GET', '/notifications/count', **kwargs)

    async def mark_notification_as_read(self, **kwargs):
        """Mark notification as read."""
        return await self.request('POST', '/notifications/{notificationId}/read', **kwargs)

    async def mark_notification_as_unread(self, **kwargs):
        """Mark notification as unread."""
        return await self.request('POST', '/notifications/{notificationId}/unread', **kwargs)

    async def mark_all_notifications_as_read(self, **kwargs):
        """Mark all notifications as read."""
        return await self.request('POST', '/notifications/read-all', **kwargs)

    async def delete_notification(self, **kwargs):
        """Delete notification."""
        return await self.request('DELETE', '/notifications/{notificationId}', **kwargs)

    async def mark_events_notifications_read(self, **kwargs):
        """Mark events notifications read."""
        return await self.request('POST', '/notifications/events/{scopeId}/read', **kwargs)

    async def mark_posts_notifications_read(self, **kwargs):
        """Mark posts notifications read."""
        return await self.request('POST', '/notifications/posts/{scopeId}/read', **kwargs)

    async def list_muted_items(self, **kwargs):
        """List muted items."""
        return await self.request('GET', '/muting', **kwargs)

    async def mute_event(self, **kwargs):
        """Mute event."""
        return await self.request('POST', '/muting/events/{eventId}', **kwargs)

    async def unmute_event(self, **kwargs):
        """Unmute event."""
        return await self.request('DELETE', '/muting/events/{eventId}', **kwargs)

    async def mute_post(self, **kwargs):
        """Mute post."""
        return await self.request('POST', '/muting/posts/{postId}', **kwargs)

    async def unmute_post(self, **kwargs):
        """Unmute post."""
        return await self.request('DELETE', '/muting/posts/{postId}', **kwargs)

    async def inspect_events_mute_status(self, **kwargs):
        """Inspect events mute status."""
        return await self.request('GET', '/muting/events/{targetId}', **kwargs)

    async def inspect_posts_mute_status(self, **kwargs):
        """Inspect posts mute status."""
        return await self.request('GET', '/muting/posts/{targetId}', **kwargs)

    async def get_current_profile(self, **kwargs):
        """Get current profile."""
        return await self.request('GET', '/profile', **kwargs)

    async def update_profile(self, **kwargs):
        """Update profile."""
        return await self.request('PUT', '/profile', **kwargs)

    async def get_profile_by_username(self, **kwargs):
        """Get profile by username."""
        return await self.request('GET', '/profile/{username}', **kwargs)

    async def get_privacy_settings(self, **kwargs):
        """Get privacy settings."""
        return await self.request('GET', '/settings/privacy', **kwargs)

    async def update_privacy_settings(self, **kwargs):
        """Update privacy settings."""
        return await self.request('PUT', '/settings/privacy', **kwargs)

    async def get_notification_settings(self, **kwargs):
        """Get notification settings."""
        return await self.request('GET', '/settings/notifications', **kwargs)

    async def save_notification_preferences(self, **kwargs):
        """Save notification preferences."""
        return await self.request('PUT', '/settings/notifications', **kwargs)

    async def list_custom_themes(self, **kwargs):
        """List custom themes."""
        return await self.request('GET', '/themes', **kwargs)

    async def create_custom_theme(self, **kwargs):
        """Create custom theme."""
        return await self.request('POST', '/themes', **kwargs)

    async def get_theme_preferences(self, **kwargs):
        """Get theme preferences."""
        return await self.request('GET', '/themes/preferences', **kwargs)

    async def set_theme_preferences(self, **kwargs):
        """Set theme preferences."""
        return await self.request('PUT', '/themes/preferences', **kwargs)

    async def update_custom_theme(self, **kwargs):
        """Update custom theme."""
        return await self.request('PUT', '/themes/{themeId}', **kwargs)

    async def delete_custom_theme(self, **kwargs):
        """Delete custom theme."""
        return await self.request('DELETE', '/themes/{themeId}', **kwargs)

    def list_link_and_email_invites_items(self, **kwargs):
        return self.iterate('/events/{eventId}/invites', adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, **kwargs)

    async def list_link_and_email_invites(self, **kwargs):
        """List link and email invites."""
        return await self.request('GET', '/events/{eventId}/invites', **kwargs)

    async def create_link_invitation(self, **kwargs):
        """Create link invitation."""
        return await self.request('POST', '/events/{eventId}/invites', **kwargs)

    async def create_email_invitation(self, **kwargs):
        """Create email invitation."""
        return await self.request('POST', '/events/{eventId}/invites/email', **kwargs)

    async def create_member_invitation(self, **kwargs):
        """Create member invitation."""
        return await self.request('POST', '/events/{eventId}/member-invites', **kwargs)

    def list_username_invitations_items(self, **kwargs):
        return self.iterate('/events/{eventId}/member-invites', adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, **kwargs)

    async def list_username_invitations(self, **kwargs):
        """List username invitations."""
        return await self.request('GET', '/events/{eventId}/member-invites', **kwargs)

    async def create_pending_invitation(self, **kwargs):
        """Create pending invitation."""
        return await self.request('POST', '/events/{eventId}/invites/send-pending', **kwargs)

    async def edit_invitation(self, **kwargs):
        """Edit invitation."""
        return await self.request('PATCH', '/invites/{inviteId}', **kwargs)

    async def delete_invitation(self, **kwargs):
        """Delete invitation."""
        return await self.request('DELETE', '/invites/{inviteId}', **kwargs)

    async def inspect_bearer_invitation(self, **kwargs):
        """Inspect bearer invitation."""
        return await self.request('GET', '/invites/{token}', **kwargs)

    async def accept_bearer_invitation(self, **kwargs):
        """Accept bearer invitation."""
        return await self.request('POST', '/invites/{token}/accept', **kwargs)

    def list_username_invitations_member_invites_items(self, **kwargs):
        return self.iterate('/member-invites', adapter={'items': 'items', 'cursor': 'nextCursor', 'mode': 'cursor'}, **kwargs)

    async def list_username_invitations_member_invites(self, **kwargs):
        """List username invitations."""
        return await self.request('GET', '/member-invites', **kwargs)

    async def inspect_username_invitation(self, **kwargs):
        """Inspect username invitation."""
        return await self.request('GET', '/member-invites/{inviteId}', **kwargs)

    async def cancel_username_invitation(self, **kwargs):
        """cancel username invitation."""
        return await self.request('DELETE', '/member-invites/{inviteId}', **kwargs)

    async def accept_username_invitation(self, **kwargs):
        """accept username invitation."""
        return await self.request('POST', '/member-invites/{inviteId}/accept', **kwargs)

    async def decline_username_invitation(self, **kwargs):
        """decline username invitation."""
        return await self.request('POST', '/member-invites/{inviteId}/decline', **kwargs)

    async def invite_a_list_s_current_people_to_an_event(self, **kwargs):
        """Invite a list’s current people to an event."""
        return await self.request('POST', '/invite-lists/{inviteListId}/invite-to-event', **kwargs)

    async def edit_a_private_invite_list(self, **kwargs):
        """Edit a private Invite list."""
        return await self.request('PATCH', '/invite-lists/{inviteListId}', **kwargs)

    async def delete_a_private_invite_list(self, **kwargs):
        """Delete a private Invite list."""
        return await self.request('DELETE', '/invite-lists/{inviteListId}', **kwargs)

    async def inspect_a_private_invite_list(self, **kwargs):
        """Inspect a private Invite list."""
        return await self.request('GET', '/invite-lists/{inviteListId}', **kwargs)

    async def search_existing_people_by_username(self, **kwargs):
        """Search existing people by username."""
        return await self.request('GET', '/invite-lists/people/search', **kwargs)

    async def list_accepted_friend_choices(self, **kwargs):
        """List accepted friend choices."""
        return await self.request('GET', '/invite-lists/people/friends', **kwargs)

    async def list_private_invite_lists(self, **kwargs):
        """List private Invite lists."""
        return await self.request('GET', '/invite-lists', **kwargs)

    async def create_a_private_invite_list(self, **kwargs):
        """Create a private Invite list."""
        return await self.request('POST', '/invite-lists', **kwargs)

    async def create_report(self, **kwargs):
        """Create report."""
        return await self.request('POST', '/reports', **kwargs)

    async def list_all_users(self, **kwargs):
        """List all users."""
        return await self.request('GET', '/admin/users', **kwargs)

    async def delete_user(self, **kwargs):
        """Delete user."""
        return await self.request('DELETE', '/admin/users/{userId}', **kwargs)

    async def set_user_role(self, **kwargs):
        """Set user role."""
        return await self.request('PUT', '/admin/users/{userId}/role', **kwargs)

    async def list_all_events(self, **kwargs):
        """List all events."""
        return await self.request('GET', '/admin/events', **kwargs)

    async def delete_event_admin(self, **kwargs):
        """Delete event (admin)."""
        return await self.request('DELETE', '/admin/events/{eventId}', **kwargs)

    async def list_all_reports(self, **kwargs):
        """List all reports."""
        return await self.request('GET', '/admin/reports', **kwargs)

    async def inspect_upload(self, **kwargs):
        """Read an accessible file descriptor."""
        return await self.request('GET', '/uploads/{storageId}', **kwargs)

