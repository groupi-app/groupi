'use client';

import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { EventCard } from './event-card';
import { useUserEvents } from '@/hooks/convex/use-events';
import { EventListSkeleton } from '@/components/skeletons';
import { useState, useEffect } from 'react';
import { Doc } from '@/convex/_generated/dataModel';
import { isEventPast } from '@/lib/utils';
import { Icons } from '@/components/icons';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { MutedEventsProvider } from '@/hooks/convex/use-muting';

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -15 },
};

type SortBy = 'title' | 'createdat' | 'eventdate' | 'lastactivity';
type Filter = 'all' | 'my';

interface EventListProps {
  userId?: string;
  sortBy?: SortBy;
  filter?: Filter;
}

/**
 * Event list component with Convex real-time subscriptions
 * - Uses Convex hooks for real-time data with automatic updates
 * - No need for React Query or Pusher - Convex handles everything
 */
export function EventList({
  sortBy = 'createdat',
  filter = 'all',
}: EventListProps = {}) {
  const [isMounted, setIsMounted] = useState(false);
  const [pastEventsOpen, setPastEventsOpen] = useState(false);

  // Only enable animations after hydration to prevent mismatch
  useEffect(() => {
    requestAnimationFrame(() => {
      setIsMounted(true);
    });
  }, []);

  // Use Convex hook for real-time user events
  const userEventsData = useUserEvents();

  // Loading state
  if (userEventsData === undefined) {
    return <EventListSkeleton />;
  }

  // Destructure the response - it's { events: [...], userId: ... }
  const { events: membershipsArray } = userEventsData;
  const memberships = membershipsArray || [];
  type OrganizerData = {
    person: Doc<'persons'>;
    user: {
      id: string;
      name?: string | null;
      email: string;
      image?: string | null;
    };
  } | null;
  type EventMembership = {
    event: Doc<'events'> & { memberCount: number; chosenDateTime?: number };
    membership: Doc<'memberships'>;
    organizer: OrganizerData;
  };

  type EventListItem = {
    id: string;
    title: string;
    description: string;
    location: string;
    chosenDateTime: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };

  const events = memberships.map(
    (m: EventMembership): EventListItem => ({
      id: m.event._id,
      title: m.event.title,
      description: m.event.description || '',
      location: m.event.location || '',
      chosenDateTime: m.event.chosenDateTime
        ? new Date(m.event.chosenDateTime)
        : null,
      createdAt: new Date(m.event._creationTime),
      updatedAt: new Date(m.event._creationTime),
    })
  );

  const sort = (a: EventListItem, b: EventListItem) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'createdat':
        return b.createdAt.getTime() - a.createdAt.getTime();
      case 'eventdate':
        return !a.chosenDateTime
          ? -1
          : !b.chosenDateTime
            ? 1
            : b.chosenDateTime.getTime() - a.chosenDateTime.getTime();
      case 'lastactivity':
        return b.updatedAt.getTime() - a.updatedAt.getTime();
    }
  };

  const filteredEvents =
    filter === 'my'
      ? events.filter((event: EventListItem) =>
          memberships.some(
            (membership: EventMembership) =>
              membership.event._id === event.id &&
              membership.membership.role === 'ORGANIZER'
          )
        )
      : events;

  // Separate upcoming and past events
  const upcomingEvents = filteredEvents.filter((event: EventListItem) => {
    const membershipData = memberships.find(
      (m: EventMembership) => m.event._id === event.id
    );
    if (!membershipData) return false;
    return !isEventPast(
      membershipData.event.chosenDateTime,
      membershipData.event.chosenEndDateTime
    );
  });

  const pastEvents = filteredEvents.filter((event: EventListItem) => {
    const membershipData = memberships.find(
      (m: EventMembership) => m.event._id === event.id
    );
    if (!membershipData) return false;
    return isEventPast(
      membershipData.event.chosenDateTime,
      membershipData.event.chosenEndDateTime
    );
  });

  return (
    <MutedEventsProvider>
      <LayoutGroup>
        <div className='flex flex-col gap-4'>
          {/* Upcoming events */}
          <AnimatePresence mode='popLayout'>
            {upcomingEvents.sort(sort).map((event: EventListItem) => {
              const membershipData = memberships.find(
                (m: EventMembership) => m.event._id === event.id
              );
              if (!membershipData) return null;
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
                    event={membershipData.event as Doc<'events'>}
                    userRole={membershipData.membership.role || 'ATTENDEE'}
                    eventId={membershipData.event._id}
                    organizer={membershipData.organizer}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Past events collapsible section */}
          {pastEvents.length > 0 && (
            <Collapsible open={pastEventsOpen} onOpenChange={setPastEventsOpen}>
              <CollapsibleTrigger className='flex items-center gap-2 w-full py-4 px-2 hover:bg-accent/80 rounded-md transition-all cursor-pointer'>
                <Icons.forward
                  className={`size-4 transition-transform duration-200 ${
                    pastEventsOpen ? 'rotate-90' : ''
                  }`}
                />
                <span className='text-muted-foreground'>
                  Past Events ({pastEvents.length})
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className='flex flex-col gap-4 pt-2'>
                  <AnimatePresence mode='popLayout'>
                    {pastEvents.sort(sort).map((event: EventListItem) => {
                      const membershipData = memberships.find(
                        (m: EventMembership) => m.event._id === event.id
                      );
                      if (!membershipData) return null;
                      return (
                        <motion.div
                          layout
                          layoutId={`past-${event.id}`}
                          variants={isMounted ? item : undefined}
                          initial={isMounted ? 'hidden' : undefined}
                          animate={isMounted ? 'show' : undefined}
                          {...(isMounted && { exit: 'exit' })}
                          key={event.id}
                        >
                          <EventCard
                            event={membershipData.event as Doc<'events'>}
                            userRole={
                              membershipData.membership.role || 'ATTENDEE'
                            }
                            eventId={membershipData.event._id}
                            organizer={membershipData.organizer}
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </LayoutGroup>
    </MutedEventsProvider>
  );
}
