'use client';

import type { UserDashboardData } from '@groupi/schema';
import { LayoutGroup, motion } from 'framer-motion';
import { useState } from 'react';
import { EventCard } from './event-card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRealtimeSync } from '@/hooks/use-realtime-sync';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

type Event = UserDashboardData['memberships'][0]['event'];
type Membership = UserDashboardData['memberships'][0];

interface EventListClientProps {
  events: Event[];
  memberships: Membership[];
  userId: string;
}

/**
 * Client component with hybrid caching + realtime
 * - Receives cached initial data from server for fast load
 * - Syncs with realtime database changes for live event updates
 */
export function EventListClient({
  events: initialEvents,
  memberships: initialMemberships,
  userId,
}: EventListClientProps) {
  const [events, setEvents] = useState(initialEvents);
  const [memberships, setMemberships] = useState(initialMemberships);
  const [sortBy, setSortBy] = useState<
    'title' | 'createdat' | 'eventdate' | 'lastactivity'
  >('lastactivity');
  const [filter, setFilter] = useState<'all' | 'my'>('all');

  // Sync with realtime event changes
  useRealtimeSync({
    channel: `user-${userId}-events`,
    table: 'Event',
    filter: `id=in.(${events.map(e => e.id).join(',')})`,
    onUpdate: payload => {
      // Optimistically update event in list
      setEvents(prev =>
        prev.map(e => (e.id === payload.new.id ? { ...e, ...payload.new } : e))
      );
    },
    onDelete: payload => {
      // Optimistically remove event from list
      setEvents(prev => prev.filter(e => e.id !== payload.old.id));
      setMemberships(prev => prev.filter(m => m.event.id !== payload.old.id));
    },
    refreshOnChange: true,
  });

  // Sync with realtime membership changes (user joining/leaving events)
  useRealtimeSync({
    channel: `user-${userId}-memberships`,
    table: 'Membership',
    filter: `personId=eq.${userId}`,
    onInsert: () => {
      // New membership - refresh to get full event data
    },
    onDelete: payload => {
      // Left an event - remove it
      setMemberships(prev => prev.filter(m => m.id !== payload.old.id));
      setEvents(prev => prev.filter(e => e.id !== payload.old.eventId));
    },
    refreshOnChange: true,
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
    <div>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-4'>
        <h1 className='text-5xl font-heading font-medium'>My Events</h1>
        <div className='flex items-center gap-2'>
          <div className='flex-items-center'>
            <Button
              className='rounded-r-none'
              onClick={() => {
                setFilter('all');
              }}
              variant={filter === 'all' ? 'secondary' : 'outline'}
            >
              All
            </Button>
            <Button
              className='rounded-l-none'
              onClick={() => {
                setFilter('my');
              }}
              variant={filter === 'my' ? 'secondary' : 'outline'}
            >
              Owned by me
            </Button>
          </div>
          <div className='w-36'>
            <Select
              value={sortBy}
              onValueChange={value =>
                setSortBy(
                  value as 'title' | 'createdat' | 'eventdate' | 'lastactivity'
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='Sort By' />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Sort By</SelectLabel>
                  <SelectItem value='title'>Title</SelectItem>
                  <SelectItem value='createdat'>Date Created</SelectItem>
                  <SelectItem value='eventdate'>Event Date</SelectItem>
                  <SelectItem value='lastactivity'>Latest Activity</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <motion.div
        initial='hidden'
        animate='show'
        variants={container}
        className='flex flex-col gap-4'
      >
        <LayoutGroup>
          {filteredEvents.sort(sort).map(event => (
            <motion.div layout variants={item} key={event.id}>
              <EventCard event={event} />
            </motion.div>
          ))}
        </LayoutGroup>
      </motion.div>
    </div>
  );
}
