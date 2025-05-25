'use client';
import { useEventMembers } from '@/data/event-hooks';
import { getFullName } from '@/lib/utils';
import { MembershipWithAvailabilities } from '@/types';
import { $Enums } from '@prisma/client';
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

export function AttendeeList({ eventId }: { eventId: string }) {
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'rsvp'>('role');
  const { data: memberData } = useEventMembers(eventId);

  const {
    members,
    userRole,
    userId,
    eventDateTime,
  }: {
    members: MembershipWithAvailabilities[];
    userRole: $Enums.Role;
    userId: string;
    eventDateTime: Date | null;
  } = memberData;

  const sort = (
    a: MembershipWithAvailabilities,
    b: MembershipWithAvailabilities
  ) => {
    switch (sortBy) {
      case 'name':
        return getFullName(a.person.firstName, a.person.lastName).localeCompare(
          getFullName(b.person.firstName, b.person.lastName)
        );
      case 'role':
        // sort by role descending, then by name ascending if roles are equal
        // organizer > moderator > attendee
        return (
          (b.role === 'ORGANIZER' ? 3 : b.role === 'MODERATOR' ? 2 : 1) -
            (a.role === 'ORGANIZER' ? 3 : a.role === 'MODERATOR' ? 2 : 1) ||
          getFullName(a.person.firstName, a.person.lastName).localeCompare(
            getFullName(b.person.firstName, b.person.lastName)
          )
        );
      case 'rsvp':
        // sort by rsvp status descending, then by name ascending if roles are equal
        // yes > maybe > no > pending
        // not selectable if eventDateTime is null
        if (!eventDateTime) return 0;
        return (
          (b.rsvpStatus === 'YES'
            ? 3
            : b.rsvpStatus === 'MAYBE'
              ? 2
              : b.rsvpStatus === 'NO'
                ? 1
                : 0) -
            (a.rsvpStatus === 'YES'
              ? 3
              : a.rsvpStatus === 'MAYBE'
                ? 2
                : a.rsvpStatus === 'NO'
                  ? 1
                  : 0) ||
          getFullName(a.person.firstName, a.person.lastName).localeCompare(
            getFullName(b.person.firstName, b.person.lastName)
          )
        );
    }
  };

  return (
    <div>
      <div className='w-36 mt-4'>
        <Select
          value={sortBy}
          onValueChange={value => setSortBy(value as 'name' | 'role' | 'rsvp')}
        >
          <SelectTrigger>
            <SelectValue placeholder='Sort By' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Sort By</SelectLabel>
              <SelectItem value='role'>Role</SelectItem>
              <SelectItem value='name'>Name</SelectItem>
              {eventDateTime && (
                <SelectItem value='rsvp'>RSVP Status</SelectItem>
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <motion.div
        initial='hidden'
        animate='show'
        variants={container}
        className='flex flex-col divide-y py-4'
      >
        <LayoutGroup>
          {members.sort(sort).map(member => (
            <motion.div layout variants={item} key={member.id}>
              <AttendeeSlate
                itemKey={member.id}
                userId={userId}
                userRole={userRole}
                member={member}
              />
            </motion.div>
          ))}
        </LayoutGroup>
      </motion.div>
    </div>
  );
}
