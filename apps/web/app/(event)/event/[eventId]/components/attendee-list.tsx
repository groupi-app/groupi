'use client';
import { useEventAttendees } from '@groupi/hooks';
import { LayoutGroup, motion } from 'framer-motion';
import { useState } from 'react';
import { AttendeeSlate } from './attendee-slate';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

export function AttendeeList({ eventId }: { eventId: string }) {
  const [sortBy, setSortBy] = useState<'name' | 'role'>('name');
  const [filterBy, setFilterBy] = useState<'all' | 'organizer' | 'attendee'>(
    'all'
  );

  const { data, isLoading } = useEventAttendees(eventId);

  if (isLoading || !data) {
    return <div>Loading attendees...</div>;
  }

  const [error, attendeesData] = data;

  if (error) {
    switch (error._tag) {
      case 'NotFoundError':
        return <div>Event not found</div>;
      case 'UnauthorizedError':
        return <div>You are not a member of this event</div>;
      case 'DatabaseError':
        return <div>Error loading attendees</div>;
      default:
        return <div>An unexpected error occurred</div>;
    }
  }

  const { event } = attendeesData;
  const { memberships } = event;

  const sortedAttendees = [...memberships].sort((a, b) => {
    if (sortBy === 'name') {
      return (a.person.user.name || a.person.user.email).localeCompare(
        b.person.user.name || b.person.user.email
      );
    } else {
      return a.role.localeCompare(b.role);
    }
  });

  const filteredAttendees = sortedAttendees.filter(attendee => {
    if (filterBy === 'all') return true;
    if (filterBy === 'organizer') return attendee.role === 'ORGANIZER';
    if (filterBy === 'attendee') return attendee.role === 'ATTENDEE';
    return true;
  });

  return (
    <div>
      <div className='flex items-center gap-2 mb-2'>
        <h1 className='font-heading text-4xl'>Attendees</h1>
        <h1 className='font-heading text-4xl text-muted-foreground'>
          ({memberships.length})
        </h1>
      </div>
      <div className='flex items-center gap-2 my-4'>
        <Select
          value={sortBy}
          onValueChange={value => setSortBy(value as 'name' | 'role')}
        >
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Sort by' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Sort by</SelectLabel>
              <SelectItem value='name'>Name</SelectItem>
              <SelectItem value='role'>Role</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          value={filterBy}
          onValueChange={value =>
            setFilterBy(value as 'all' | 'organizer' | 'attendee')
          }
        >
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Filter by' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Filter by</SelectLabel>
              <SelectItem value='all'>All</SelectItem>
              <SelectItem value='organizer'>Organizers</SelectItem>
              <SelectItem value='attendee'>Attendees</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <motion.div
        initial='hidden'
        animate='show'
        variants={container}
        className='flex flex-col gap-2'
      >
        <LayoutGroup>
          {filteredAttendees.map(attendee => (
            <motion.div layout variants={item} key={attendee.id}>
              <AttendeeSlate
                key={attendee.id}
                userId={attendee.person.id}
                userRole={attendee.role}
                member={{
                  ...attendee,
                  event: { chosenDateTime: event.chosenDateTime },
                }}
                itemKey={attendee.id}
              />
            </motion.div>
          ))}
        </LayoutGroup>
      </motion.div>
    </div>
  );
}
