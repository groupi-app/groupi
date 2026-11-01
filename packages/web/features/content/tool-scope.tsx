'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

export type ContentOwnerId = Id<'groups'> | Id<'events'>;
const EventToolContext = createContext<Id<'events'> | undefined>(undefined);

/** Event routes mount the same tools with an explicit owner; Group routes keep their existing API. */
export function EventToolScope({
  eventId,
  children,
}: {
  eventId: Id<'events'>;
  children: ReactNode;
}) {
  return (
    <EventToolContext.Provider key={eventId} value={eventId}>
      {children}
    </EventToolContext.Provider>
  );
}
export function useEventToolId() {
  return useContext(EventToolContext);
}
export function useContentBase(ownerId: ContentOwnerId) {
  const eventId = useEventToolId();
  return eventId ? `/event/${eventId}` : `/groups/${ownerId}`;
}
export function useToolOwner(ownerId: ContentOwnerId) {
  const eventId = useEventToolId();
  const group = useQuery(
    api.groups.queries.getGroup,
    eventId ? 'skip' : { groupId: ownerId as Id<'groups'> }
  );
  const event = useQuery(
    api.eventContent.queries.getContext,
    eventId ? { eventId } : 'skip'
  );
  if (!eventId) return group;
  if (event === undefined) return undefined;
  if (!event) return null;
  return {
    viewerRole: event.canManage ? ('OWNER' as const) : ('MEMBER' as const),
    joiningQuestionnaire: { canAccessMemberContent: true },
  };
}
