'use client';

import type { UserDashboardData, EventHeaderData } from '@groupi/schema/data';
import type { MembershipData } from '@groupi/schema';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { EventCard } from './event-card';
import { usePusherRealtime } from '@/hooks/use-pusher-realtime';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchUserEvents } from '@/lib/queries/event-queries';
import { qk } from '@/lib/query-keys';
import { useState, useEffect } from 'react';

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -15 },
};

type Event = UserDashboardData['memberships'][0]['event'];
type Membership = UserDashboardData['memberships'][0];

type SortBy = 'title' | 'createdat' | 'eventdate' | 'lastactivity';
type Filter = 'all' | 'my';

interface EventListClientProps {
  events: Event[];
  memberships: Membership[];
  userId: string;
  sortBy: SortBy;
  filter: Filter;
}

/**
 * Client component with hybrid caching + realtime
 * - Receives cached initial data from server for fast load (SSR/PPR)
 * - React Query manages client-side state for optimistic updates
 * - Pusher syncs real-time updates via setQueryData (no router.refresh)
 */
export function EventListClient({
  memberships: initialMemberships,
  userId,
  sortBy,
  filter,
}: EventListClientProps) {
  const queryClient = useQueryClient();
  const [isMounted, setIsMounted] = useState(false);
  
  // Only enable animations after hydration to prevent mismatch
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      setIsMounted(true);
    });
  }, []);

  // React Query manages client-side state
  const { data: userData } = useQuery({
    queryKey: qk.events.listByUser(userId),
    queryFn: () => fetchUserEvents(),
    initialData: {
      id: userId,
      memberships: initialMemberships,
    } as UserDashboardData,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5min (matches server cache TTL)
  });

  const memberships = userData?.memberships || initialMemberships;
  const events = memberships.map(m => m.event);

  // Sync with Pusher event changes using setQueryData (no router.refresh)
  usePusherRealtime({
    channel: `user-${userId}-events`,
    event: 'event-changed',
    tags: [`user-${userId}-events`],
    queryKey: qk.events.listByUser(userId),
    // Custom handlers to handle UserDashboardData structure
    onInsert: data => {
      // Pusher sends EventHeaderData for create, or { id: eventId } for accept invite
      const insertData = data as EventHeaderData | { id: string };
      queryClient.setQueryData<UserDashboardData>(
        qk.events.listByUser(userId),
        (old: UserDashboardData | undefined) => {
          if (!old) return old;

          // If we only have id, skip (will be fetched via cache invalidation)
          if (!('event' in insertData)) {
            return old;
          }

          // Check if already exists
          if (old.memberships.some(m => m.event.id === insertData.event.id)) {
            return old;
          }

          // Create membership from EventHeaderData
          const newMembership = {
            id: insertData.userMembership.id,
            role: insertData.userMembership.role,
            rsvpStatus: insertData.userMembership.rsvpStatus,
            event: {
              id: insertData.event.id,
              title: insertData.event.title,
              description: insertData.event.description || '',
              location: insertData.event.location || '',
              chosenDateTime: insertData.event.chosenDateTime,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          };

          return {
            ...old,
            memberships: [newMembership, ...old.memberships],
          };
        }
      );
    },
    onDelete: data => {
      const deleteData = data as { id: string };
      queryClient.setQueryData<UserDashboardData>(
        qk.events.listByUser(userId),
        (old: UserDashboardData | undefined) => {
          if (!old) return old;

          return {
            ...old,
            memberships: old.memberships.filter(
              m => m.event.id !== deleteData.id
            ),
          };
        }
      );
    },
  });

  // Sync with Pusher membership changes using setQueryData (no router.refresh)
  usePusherRealtime({
    channel: `user-${userId}-memberships`,
    event: 'member-changed',
    tags: [`user-${userId}-events`],
    queryKey: qk.events.listByUser(userId),
    // Custom handlers to preserve nested event data
    onUpdate: data => {
      // Pusher sends MembershipData (minimal) but we need to preserve event data
      const updateData = data as MembershipData;
      queryClient.setQueryData<UserDashboardData>(
        qk.events.listByUser(userId),
        (old: UserDashboardData | undefined) => {
          if (!old) return old;

          return {
            ...old,
            memberships: old.memberships.map(m =>
              m.id === updateData.id
                ? {
                    ...m,
                    role: updateData.role,
                    rsvpStatus: updateData.rsvpStatus,
                  }
                : m
            ),
          };
        }
      );
    },
  });

  const sort = (a: Event, b: Event) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'createdat':
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'eventdate':
        return !a.chosenDateTime
          ? -1
          : !b.chosenDateTime
            ? 1
            : new Date(b.chosenDateTime).getTime() -
              new Date(a.chosenDateTime).getTime();
      case 'lastactivity':
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    }
  };

  const filteredEvents =
    filter === 'my'
      ? events.filter((event: Event) =>
          memberships.some(
            (membership: Membership) =>
              membership.event.id === event.id &&
              membership.role === 'ORGANIZER'
          )
        )
      : events;

  return (
    <LayoutGroup>
      <div className='flex flex-col gap-4'>
        <AnimatePresence mode='popLayout'>
          {filteredEvents.sort(sort).map(event => {
            const membership = memberships.find(
              (m: Membership) => m.event.id === event.id
            );
            return (
              <motion.div
                layout
                layoutId={event.id}
                variants={isMounted ? item : undefined}
                initial={isMounted ? 'hidden' : undefined}
                animate={isMounted ? 'show' : undefined}
                {...(isMounted && { exit: 'exit' })}
                key={event.id}
              >
                <EventCard
                  event={event}
                  userRole={membership?.role || 'ATTENDEE'}
                  eventId={event.id}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}
