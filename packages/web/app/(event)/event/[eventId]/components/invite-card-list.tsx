'use client';

import { Id } from '@/convex/_generated/dataModel';
import { InviteCardListClient } from './invite-card-list-client';

export function InviteCardList({ eventId }: { eventId: string }) {
  // Pass the eventId cast to the proper type - InviteCardListClient handles loading internally
  return <InviteCardListClient eventId={eventId as Id<"events">} />;
}
