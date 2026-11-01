import { createContext, useContext, type ReactNode } from 'react';
import { router } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

export type ContentOwnerId = Id<'groups'> | Id<'events'>;
const EventToolContext = createContext<Id<'events'> | undefined>(undefined);
export function EventToolScope({
  eventId,
  children,
}: {
  eventId: Id<'events'>;
  children: ReactNode;
}) {
  return (
    <EventToolContext.Provider value={eventId}>
      {children}
    </EventToolContext.Provider>
  );
}
export function useEventToolScope() {
  return useContext(EventToolContext);
}
/** Keeps existing Group screens and routes while adapting their owning context. */
export function useToolCommunity(ownerId: ContentOwnerId) {
  const eventId = useEventToolScope();
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
  return {
    name: event.title,
    canManageMembers: event.canManage,
    viewerRole: event.canManage ? ('MODERATOR' as const) : ('MEMBER' as const),
    joiningQuestionnaire: { canAccessMemberContent: true },
  };
}
export function useToolRouter() {
  const eventId = useEventToolScope();
  const path = (href: string) =>
    eventId ? href.replace(`/groups/${eventId}/`, `/event/${eventId}/`) : href;
  return {
    push: (href: string) => router.push(path(href)),
    replace: (href: string) => router.replace(path(href)),
  };
}
export function belongsToOwner(
  tool: { groupId?: Id<'groups'>; eventId?: Id<'events'> },
  ownerId: ContentOwnerId
) {
  return (tool.eventId ?? tool.groupId) === ownerId;
}
