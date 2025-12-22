'use client';

import { AvailabilityForm } from '../../components/availability-form';
import type { AvailabilityPageData } from '@groupi/schema/data';
import type { MembershipData } from '@groupi/schema';
import { usePusherRealtime } from '@/hooks/use-pusher-realtime';
import { usePusherEvent } from '@/stores/pusher-channels-store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchEventAvailability } from '@/lib/queries/availability-queries';
import { qk } from '@/lib/query-keys';
import { useCallback } from 'react';

type PotentialDateTime = AvailabilityPageData['potentialDateTimes'][0];

interface AvailabilityClientProps {
  eventId: string;
  userId: string;
  potentialDateTimes: PotentialDateTime[];
}

/**
 * Client component with hybrid caching + realtime
 * - Receives cached initial data from server for fast load
 * - Uses React Query to manage availability state
 * - Syncs with realtime availability changes for live updates
 * - Syncs with member role changes for real-time role updates
 */
export function AvailabilityClient({
  eventId,
  userId,
  potentialDateTimes: initialDates,
}: AvailabilityClientProps) {
  const queryClient = useQueryClient();

  // Use React Query to manage availability data
  const { data: availabilityData } = useQuery({
    queryKey: qk.availability.data(eventId),
    queryFn: () => fetchEventAvailability(eventId),
    initialData: {
      potentialDateTimes: initialDates,
      userRole: 'ATTENDEE' as const,
      userId: userId,
    },
    staleTime: 2 * 60 * 1000, // Consider fresh for 2min (matches server cache TTL)
    select: data => data.potentialDateTimes, // Extract potentialDateTimes
  });

  const potentialDateTimes = availabilityData || initialDates;

  const getTimezoneString = () => {
    return `${Intl.DateTimeFormat().resolvedOptions().timeZone} (UTC${
      new Date().getTimezoneOffset() > 0 ? '-' : '+'
    }${Math.abs(new Date().getTimezoneOffset() / 60).toString()})`;
  };

  // Sync with Pusher availability changes - refetch when availability changes
  usePusherRealtime({
    channel: `event-${eventId}-availability`,
    event: 'availability-changed',
    tags: [`event-${eventId}-availability`],
    queryKey: qk.availability.data(eventId),
    onUpdate: () => {
      // Refetch availability data when changes occur
      queryClient.invalidateQueries({
        queryKey: qk.availability.data(eventId),
      });
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
          queryKey: qk.availability.data(eventId),
        });
        return;
      }

      // Handle role updates
      if (eventData.type === 'UPDATE' && eventData.new) {
        const updatedMembership = eventData.new;
        
        // Check if we have MembershipData (has role and rsvpStatus)
        // If we only have { id }, skip (will be handled by refetch)
        if (!('role' in updatedMembership) || !('rsvpStatus' in updatedMembership)) {
          // Not full MembershipData, skip update
          return;
        }
        
        const membershipData = updatedMembership as MembershipData;
        queryClient.setQueryData<AvailabilityPageData>(
          qk.availability.data(eventId),
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
          qk.availability.data(eventId),
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

  usePusherEvent(
    `event-${eventId}-members`,
    'member-changed',
    handleMemberChanged,
    [eventId]
  );

  // Note: PotentialDateTime changes are handled via cache invalidation
  // No Pusher channel needed - organizer actions trigger cache refresh

  return (
    <div>
      <div className='my-2'>
        <h2 className='font-heading text-4xl'>When are you around?</h2>
        <p className='text-muted-foreground text-lg'>
          Don&apos;t worry. You can update this later.
        </p>
      </div>
      <div className='py-4 w-full'>
        <span className='text-sm italic text-muted-foreground'>
          Current timezone: {getTimezoneString()}
        </span>
        <AvailabilityForm
          potentialDateTimes={potentialDateTimes}
          userId={userId}
        />
      </div>
    </div>
  );
}
