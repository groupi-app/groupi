'use client';

import MemberIcon from '@/components/member-icon';
import type { RoleType } from '@groupi/schema';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLayoutEffect, useRef, useState } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { usePusherRealtime } from '@/hooks/use-pusher-realtime';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMemberList } from '@/lib/queries/membership-queries';
import { qk } from '@/lib/query-keys';
import type { EventAttendeesPageData } from '@groupi/schema/data';
import type { MembershipData } from '@groupi/schema';
import { pusherLogger } from '@/lib/logger';

type Membership = EventAttendeesPageData['event']['memberships'][number];

interface MemberListClientProps {
  eventId: string;
  members: Membership[];
  userId: string;
  userRole: RoleType;
  eventDateTime: Date | null;
}

/**
 * Client component with hybrid caching + realtime
 * - Receives cached initial data from server for fast load (SSR/PPR)
 * - React Query manages client-side state for optimistic updates
 * - Pusher syncs real-time updates via setQueryData (no router.refresh)
 */
export function MemberListClient({
  eventId,
  members: initialMembers,
  userId,
  userRole,
  eventDateTime,
}: MemberListClientProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visibleIcons, setVisibleIcons] = useState(100);
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // Register query in cache synchronously for optimistic updates
  // initialData doesn't register the query, so we set it explicitly
  useLayoutEffect(() => {
    // Find current user's membership from initial members
    const currentUserMembership = initialMembers.find(
      m => m.person.id === userId
    );
    const userMembershipId = currentUserMembership?.id || '';
    const userMembershipRSVP = currentUserMembership?.rsvpStatus || 'PENDING';

    queryClient.setQueryData<EventAttendeesPageData>(
      qk.memberships.list(eventId),
      {
        event: {
          id: eventId,
          title: '', // Will be updated when query fetches
          chosenDateTime: eventDateTime,
          memberships: initialMembers,
        },
        userMembership: {
          id: userMembershipId,
          role: userRole,
          rsvpStatus: userMembershipRSVP,
        },
        userId: userId,
      }
    );
  }, [eventId, initialMembers, userId, userRole, eventDateTime, queryClient]);

  // React Query manages client-side state
  const { data: memberListData } = useQuery({
    queryKey: qk.memberships.list(eventId),
    queryFn: () => fetchMemberList(eventId),
    initialData: (() => {
      // Find current user's membership from initial members
      const currentUserMembership = initialMembers.find(
        m => m.person.id === userId
      );
      const userMembershipId = currentUserMembership?.id || '';
      const userMembershipRSVP = currentUserMembership?.rsvpStatus || 'PENDING';

      return {
        event: {
          id: eventId,
          title: '', // Will be updated when query fetches
          chosenDateTime: eventDateTime,
          memberships: initialMembers,
        },
        userMembership: {
          id: userMembershipId,
          role: userRole,
          rsvpStatus: userMembershipRSVP,
        },
        userId: userId,
      };
    })(),
    staleTime: 2 * 60 * 1000, // Consider fresh for 2min (matches server cache TTL)
    select: (data: EventAttendeesPageData) => data.event.memberships, // Extract memberships
  });

  const members = memberListData || initialMembers;

  // Sync with Pusher membership changes using setQueryData (no router.refresh)
  usePusherRealtime({
    channel: `event-${eventId}-members`,
    event: 'member-changed',
    tags: [`event-${eventId}-members`],
    queryKey: qk.memberships.list(eventId),
    // Custom handlers to preserve nested person data
    onInsert: data => {
      // Pusher sends minimal data (just { id } for accept invite, or MembershipData)
      // If we only have id, refetch to get full member data
      const insertData = data as { id: string } | MembershipData;

      // If we only have id (user joined), refetch to get full member data
      if (!('role' in insertData)) {
        queryClient.invalidateQueries({
          queryKey: qk.memberships.list(eventId),
        });
        return;
      }

      // If we have MembershipData but need person data, skip (will be fetched via cache invalidation)
      queryClient.setQueryData<EventAttendeesPageData>(
        qk.memberships.list(eventId),
        (old: EventAttendeesPageData | undefined) => {
          if (!old) return old;

          // Check if already exists
          if (old.event.memberships.some(m => m.id === insertData.id)) {
            return old;
          }

          // We have MembershipData but need person data
          // Skip for now - cache invalidation will fetch full data
          return old;
        }
      );
    },
    onUpdate: data => {
      pusherLogger.debug(
        { eventId, data },
        'Received onUpdate in MemberListClient'
      );
      // Pusher sends MembershipData (minimal) but we need to preserve person data
      // Verify we have MembershipData with required fields
      if (!data || typeof data !== 'object') {
        pusherLogger.debug(
          { eventId, data },
          'Skipping update - invalid data in MemberListClient'
        );
        return;
      }
      const updateData = data as MembershipData;

      // Ensure we have the required fields
      if (
        !('id' in updateData) ||
        !('role' in updateData) ||
        !('rsvpStatus' in updateData)
      ) {
        pusherLogger.debug(
          { eventId, updateData },
          'Skipping update - missing required fields in MemberListClient'
        );
        return; // Not valid MembershipData, skip
      }

      pusherLogger.debug(
        {
          eventId,
          membershipId: updateData.id,
          rsvpStatus: updateData.rsvpStatus,
        },
        'Updating cache with membership data in MemberListClient'
      );
      queryClient.setQueryData<EventAttendeesPageData>(
        qk.memberships.list(eventId),
        (old: EventAttendeesPageData | undefined) => {
          if (!old) return old;

          return {
            ...old,
            event: {
              ...old.event,
              memberships: old.event.memberships.map(m =>
                m.id === updateData.id
                  ? {
                      ...m,
                      role: updateData.role,
                      rsvpStatus: updateData.rsvpStatus,
                    }
                  : m
              ),
            },
          };
        }
      );
    },
    onDelete: data => {
      const deleteData = data as { id: string };
      queryClient.setQueryData<EventAttendeesPageData>(
        qk.memberships.list(eventId),
        (old: EventAttendeesPageData | undefined) => {
          if (!old) return old;

          return {
            ...old,
            event: {
              ...old.event,
              memberships: old.event.memberships.filter(
                m => m.id !== deleteData.id
              ),
            },
          };
        }
      );
    },
  });

  useLayoutEffect(() => {
    function checkOverflow() {
      if (ref.current) {
        const { clientWidth } = ref.current;
        const iconWidth = 40; // Replace with your icon width
        const iconsCount = Math.floor(clientWidth / iconWidth);
        setVisibleIcons(iconsCount);
      }
    }

    checkOverflow();
    window.addEventListener('resize', checkOverflow);

    return () => {
      window.removeEventListener('resize', checkOverflow);
    };
  }, [pathname]);

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
    hidden: { opacity: 0, x: 15 },
    show: { opacity: 1, x: 0 },
  };

  const sortByRole = (a: Membership, b: Membership) => {
    return (
      (b.role === 'ORGANIZER' ? 3 : b.role === 'MODERATOR' ? 2 : 1) -
        (a.role === 'ORGANIZER' ? 3 : a.role === 'MODERATOR' ? 2 : 1) ||
      (a.person.user.name || a.person.user.email).localeCompare(
        b.person.user.name || b.person.user.email
      )
    );
  };

  return (
    <div>
      <div className='flex items-center gap-2'>
        <h2 className='text-xl font-heading font-medium'>Attendees</h2>
        <div className='rounded-full p-[.3rem] flex items-center justify-center text-xs bg-muted text-muted-foreground text-center'>
          <span>{members.length}</span>
        </div>
        {(userRole === 'ORGANIZER' || userRole === 'MODERATOR') && (
          <Link href={`/event/${eventId}/invite`}>
            <Button className='flex items-center gap-1' size='sm'>
              <Icons.invite className='size-4' />
              <span>Invite</span>
            </Button>
          </Link>
        )}
      </div>
      <motion.div
        variants={container}
        initial='hidden'
        animate='show'
        ref={ref}
        className='flex items-center p-2 -space-x-2 h-[54px] overflow-hidden'
      >
        <LayoutGroup>
          <AnimatePresence>
            {members
              .sort(sortByRole)
              .map((membership: Membership, i: number) => {
                return i < visibleIcons - 1 ? (
                  <MemberIcon
                    userId={userId}
                    userRole={userRole}
                    member={membership}
                    key={membership.id}
                    itemKey={membership.id}
                    align={i === 0 ? 'start' : 'center'}
                    eventDateTime={eventDateTime}
                  />
                ) : (
                  i === visibleIcons - 1 && (
                    <motion.div variants={item} layout key={i}>
                      <Link href={`${pathname}/attendees`}>
                        <Button className='rounded-full z-30' key={i}>
                          +{members.length - visibleIcons + 1}
                        </Button>
                      </Link>
                    </motion.div>
                  )
                );
              })}
          </AnimatePresence>
        </LayoutGroup>
      </motion.div>
      <Link href={`${pathname}/attendees`}>
        <span className='rounded-full z-30 text-primary hover:underline'>
          View All
        </span>
      </Link>
    </div>
  );
}
