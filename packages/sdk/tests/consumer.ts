import {
  Groupi,
  type EventCreateResponse,
  type EventSummary,
} from '../src/index.js';
const client = new Groupi({
  instance: 'https://example.com',
  credential: { type: 'apiKey', key: 'key' },
});
const created: Promise<EventCreateResponse> = client.createEvent({
  body: { title: 'Dinner' },
});
const events: AsyncIterable<EventSummary> = client.iterateEvents({ limit: 20 });
// @ts-expect-error an event title must be a string
client.createEvent({ body: { title: 123 } });
// @ts-expect-error event IDs are explicit path parameters
client.getEvent({ path: { wrongId: 'event' } });
new Groupi({
  instance: 'https://example.com',
  // @ts-expect-error credential modes cannot silently fall back
  credential: { type: 'delegated', key: 'owner-key' },
});
void created;
void events;
// @ts-expect-error a resource read requires its path input
client.getEvent();
// @ts-expect-error event roles are a closed public enum
const invalidRole: EventSummary['userRole'] = 'ADMIN';
client.createEvent({ body: { title: 'Dinner' } }).then(result => {
  // @ts-expect-error response fields follow the public wire schema
  return result.unknownField;
});
void invalidRole;
import type { MemberListResponse, InviteListDetail } from '../src/index.js';
function readComposedSchemas(
  members: MemberListResponse,
  invite: InviteListDetail
) {
  const userId: string | undefined = members[0].user?.id;
  const note: string | null = members[0].rsvpNote;
  const personId: string = invite.people[0].personId;
  return { userId, note, personId };
}
// @ts-expect-error search requires its query input
client.searchUsers();
// @ts-expect-error search requires the q field
client.searchUsers({ query: {} });
void readComposedSchemas;
