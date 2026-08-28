import type { FunctionReturnType } from 'convex/server';
import { api } from 'convex/_generated/api';

export type InviteData = NonNullable<
  FunctionReturnType<typeof api.invites.queries.getEventInvites>
>;
export type InviteRecord = InviteData['invites'][number];
export type SentInvite = NonNullable<
  NonNullable<
    FunctionReturnType<typeof api.eventInvites.queries.getSentEventInvites>
  >[number]
>;
export type Friend = NonNullable<
  NonNullable<FunctionReturnType<typeof api.friends.queries.getFriends>>[number]
>;
export type EventMembers = NonNullable<
  FunctionReturnType<typeof api.events.queries.getEventAttendeesData>
>;

export function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
