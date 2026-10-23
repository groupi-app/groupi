from groupi_sdk import Groupi, AsyncGroupi
from groupi_sdk.client import EventCreateResponse, EventSummary, CreateEventRequest

client = Groupi(instance="https://example.com", api_key="key")
body: CreateEventRequest = {"title": "Dinner"}
created: EventCreateResponse = client.create_event(body=body)
for event in client.iterate_events():
    summary: EventSummary = event
    title: str = summary["title"]


async def create_async() -> EventCreateResponse:
    client = AsyncGroupi(instance="https://example.com", api_key="key")
    return await client.create_event(body=body)


bad_body: CreateEventRequest = {"title": 123}  # type: ignore[typeddict-item]
missing_title: CreateEventRequest = {}  # type: ignore[typeddict-item]
client.get_event(path={"wrongId": "event"})  # type: ignore[typeddict-item]
for event in client.iterate_events():
    invalid_nonnullable_image: str = event["imageUrl"]  # type: ignore[assignment]
client.get_event()  # type: ignore[call-arg]
unknown_response_field = created["unknownField"]  # type: ignore[typeddict-item]
for event in client.list_events_items():
    event["userRole"] = "ADMIN"  # type: ignore[typeddict-item]
from groupi_sdk.client import MemberListResponse, InviteListDetail


def read_composed_schemas(members: MemberListResponse, invite: InviteListDetail) -> str:
    note: str | None = members[0]["rsvpNote"]
    user = members[0]["user"]
    if user is not None:
        user_id: str = user["id"]
        return user_id
    return invite["people"][0]["personId"]


client.search_users()  # type: ignore[call-arg]
client.search_users(query={})  # type: ignore[typeddict-item]
