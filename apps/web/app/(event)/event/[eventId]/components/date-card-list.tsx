'use client';
import { PotentialDateTimeWithAvailabilities } from '@/types';
import { DateCard } from './date-card';
import { Role } from '@prisma/client';
import type { MembershipData } from '@groupi/schema';
import { usePusherEvent } from '@/stores/pusher-channels-store';
import { usePusherRealtime } from '@/hooks/use-pusher-realtime';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchEventAvailability } from '@/lib/queries/availability-queries';
import { qk } from '@/lib/query-keys';
import type { AvailabilityPageData } from '@groupi/schema/data';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getRanks } from '@/lib/utils';

import { LayoutGroup, motion } from 'framer-motion';
import { useState, useCallback } from 'react';

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

export function DateCardList({
  potentialDateTimes: initialPotentialDateTimes,
  userId,
  userRole,
}: {
  potentialDateTimes: PotentialDateTimeWithAvailabilities[];
  userId: string;
  userRole: Role;
}) {
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState<'rank' | 'date'>('rank');

  // Get eventId from potentialDateTimes
  const eventId = initialPotentialDateTimes[0]?.eventId;

  // Use React Query to manage availability data
  const { data: availabilityData } = useQuery({
    queryKey: qk.availability.data(eventId || ''),
    queryFn: () => fetchEventAvailability(eventId || ''),
    enabled: !!eventId,
    initialData: {
      potentialDateTimes: initialPotentialDateTimes,
      userRole: userRole,
      userId: userId,
    },
    staleTime: 2 * 60 * 1000,
    select: data => data.potentialDateTimes,
  });

  const potentialDateTimes = availabilityData || initialPotentialDateTimes;

  // Sync with Pusher availability changes - refetch when availability changes
  usePusherRealtime({
    channel: eventId ? `event-${eventId}-availability` : '',
    event: 'availability-changed',
    tags: eventId ? [`event-${eventId}-availability`] : [],
    queryKey: qk.availability.data(eventId || ''),
    onUpdate: () => {
      // Refetch availability data when changes occur
      if (eventId) {
        queryClient.invalidateQueries({
          queryKey: qk.availability.data(eventId),
        });
      }
    },
  });

  // Sync with Pusher member changes (user joining, role updates, and member leaving)
  const handleMemberChanged = useCallback(
    (data: unknown) => {
      const eventData = data as {
        type: 'INSERT' | 'UPDATE' | 'DELETE';
        new?: { id: string } | MembershipData;
        old?: { id: string } | MembershipData;
      };

      // Handle user joining (INSERT) - refetch to get updated availability data
      // New members won't have availabilities yet, but we should refresh the data
      if (eventData.type === 'INSERT' && eventData.new) {
        queryClient.invalidateQueries({
          queryKey: qk.availability.data(eventId || ''),
        });
        return;
      }

      // Handle role updates
      if (eventData.type === 'UPDATE' && eventData.new) {
        const updatedMembership = eventData.new;

        // Check if we have MembershipData (has role and rsvpStatus)
        // If we only have { id }, skip (will be handled by refetch)
        if (
          !('role' in updatedMembership) ||
          !('rsvpStatus' in updatedMembership)
        ) {
          // Not full MembershipData, skip update
          return;
        }

        const membershipData = updatedMembership as MembershipData;
        queryClient.setQueryData<AvailabilityPageData>(
          qk.availability.data(eventId || ''),
          (old: AvailabilityPageData | undefined) => {
            if (!old) return old;

            return {
              ...old,
              potentialDateTimes: old.potentialDateTimes.map(pdt => ({
                ...pdt,
                availabilities: pdt.availabilities.map(avail =>
                  avail.membership.id === membershipData.id
                    ? {
                        ...avail,
                        membership: {
                          ...avail.membership,
                          role: membershipData.role,
                          rsvpStatus: membershipData.rsvpStatus,
                        },
                      }
                    : avail
                ),
              })),
            };
          }
        );
      }

      // Handle member leaving (DELETE) - remove their availabilities
      if (eventData.type === 'DELETE' && eventData.old) {
        const deleteData = eventData.old as { id: string };
        queryClient.setQueryData<AvailabilityPageData>(
          qk.availability.data(eventId || ''),
          (old: AvailabilityPageData | undefined) => {
            if (!old) return old;

            return {
              ...old,
              potentialDateTimes: old.potentialDateTimes.map(pdt => ({
                ...pdt,
                availabilities: pdt.availabilities.filter(
                  avail => avail.membership.id !== deleteData.id
                ),
              })),
            };
          }
        );
      }
    },
    [eventId, queryClient]
  );

  // Subscribe to member role changes if eventId is available
  usePusherEvent(
    eventId ? `event-${eventId}-members` : '',
    'member-changed',
    handleMemberChanged,
    [eventId]
  );

  const sort = (
    a: PotentialDateTimeWithAvailabilities & { rank: number },
    b: PotentialDateTimeWithAvailabilities & { rank: number }
  ) => {
    switch (sortBy) {
      case 'rank':
        // sort by rank, then by date if ranks are equal
        return (
          a.rank - b.rank ||
          new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
        );
      case 'date':
        // sort by date
        return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
    }
  };

  return (
    <>
      <div className='w-36 my-2'>
        <Select
          value={sortBy}
          onValueChange={value => setSortBy(value as 'rank' | 'date')}
        >
          <SelectTrigger>
            <SelectValue placeholder='Sort By' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Sort By</SelectLabel>
              <SelectItem value='rank'>Rank</SelectItem>
              <SelectItem value='date'>Date</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <motion.div
        initial='hidden'
        animate='show'
        variants={container}
        className='flex flex-col gap-3'
      >
        <LayoutGroup>
          {getRanks(potentialDateTimes)
            .sort(sort)
            .map(pdt => (
              <motion.div layout variants={item} key={pdt.id}>
                <DateCard pdt={pdt} userId={userId} userRole={userRole} />
              </motion.div>
            ))}
        </LayoutGroup>
      </motion.div>
    </>
  );
}
