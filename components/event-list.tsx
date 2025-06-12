'use client';

import { usePersonMemberships } from '@/data/person-hooks';
import { EventWithMembers, MembershipEventWithMembers } from '@/types';

import { LayoutGroup, motion } from 'framer-motion';
import { useState } from 'react';
import { EventCard } from './event-card';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './ui/select';

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

export function EventList({ userId }: { userId: string }) {
  const { data: userData } = usePersonMemberships(userId);
  const { memberships }: { memberships: MembershipEventWithMembers[] } =
    userData;
  const events = memberships.map(membership => membership.event);
  const [sortBy, setSortBy] = useState<
    'title' | 'createdat' | 'eventdate' | 'lastactivity'
  >('lastactivity');
  const [filter, setFilter] = useState<'all' | 'my'>('all');

  const sort = (a: EventWithMembers, b: EventWithMembers) => {
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
      ? events.filter(event =>
          event.memberships.some(
            membership =>
              membership.personId === userId && membership.role === 'ORGANIZER'
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
                setSortBy(value as 'title' | 'createdat' | 'lastactivity')
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
