'use client';

import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { VisualEventCard } from './visual-event-card';
import { CreateEventCard } from './create-event-card';
import { EmptyState } from '@/components/molecules';
import { Doc } from '@/convex/_generated/dataModel';

const item = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

type OrganizerData = {
  person: Doc<'persons'>;
  user: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  };
} | null;

export type EventMembershipData = {
  event: Doc<'events'> & {
    imageUrl?: string | null;
    memberCount?: number;
    chosenDateTime?: number;
    chosenEndDateTime?: number;
  };
  membership: Doc<'memberships'>;
  organizer: OrganizerData;
};

export interface EventGridProps {
  /** List of event memberships to display */
  events: EventMembershipData[];
  /** Whether to show the create event card */
  showCreateCard?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Custom empty state description */
  emptyDescription?: string;
}

/**
 * EventGrid - Responsive grid of visual event cards
 */
export function EventGrid({
  events,
  showCreateCard = true,
  emptyMessage = 'No events found',
  emptyDescription,
}: EventGridProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Only enable animations after hydration to prevent mismatch
  useEffect(() => {
    requestAnimationFrame(() => {
      setIsMounted(true);
    });
  }, []);

  // Empty state
  if (events.length === 0 && !showCreateCard) {
    return <EmptyState message={emptyMessage} description={emptyDescription} />;
  }

  return (
    <LayoutGroup>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {/* Event cards */}
        <AnimatePresence mode='popLayout'>
          {events.map(m => (
            <motion.div
              layout
              layoutId={m.event._id}
              variants={isMounted ? item : undefined}
              initial={isMounted ? 'hidden' : undefined}
              animate={isMounted ? 'show' : undefined}
              {...(isMounted && { exit: 'exit' })}
              key={m.event._id}
            >
              <VisualEventCard
                event={m.event}
                userRole={m.membership.role || 'ATTENDEE'}
                eventId={m.event._id}
                organizer={m.organizer}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Create event card (last in grid) */}
        {showCreateCard && (
          <motion.div
            layout
            layoutId='create-event'
            variants={isMounted ? item : undefined}
            initial={isMounted ? 'hidden' : undefined}
            animate={isMounted ? 'show' : undefined}
          >
            <CreateEventCard />
          </motion.div>
        )}

        {/* Empty state for no events (but with create card) */}
        {events.length === 0 && showCreateCard && (
          <div className='col-span-full text-center py-8 text-muted-foreground'>
            <p>Create your first event to get started!</p>
          </div>
        )}
      </div>
    </LayoutGroup>
  );
}
