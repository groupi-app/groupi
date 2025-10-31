'use client';

import MemberIcon from './member-icon';
import type { MemberListPageData, RoleType } from '@groupi/schema';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLayoutEffect, useRef, useState } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useRealtimeSync } from '@/hooks/use-realtime-sync';

type Membership = MemberListPageData['event']['memberships'][number];

interface MemberListClientProps {
  eventId: string;
  members: Membership[];
  userId: string;
  userRole: RoleType;
  eventDateTime: Date | null;
}

/**
 * Client component with hybrid caching + realtime
 * - Receives cached initial data from server for fast load
 * - Syncs with realtime database changes for live member updates
 */
export function MemberListClient({
  eventId,
  members: initialMembers,
  userId,
  userRole,
  eventDateTime,
}: MemberListClientProps) {
  const [members, setMembers] = useState(initialMembers);
  const ref = useRef<HTMLDivElement>(null);
  const [visibleIcons, setVisibleIcons] = useState(100);
  const pathname = usePathname();

  // Sync with realtime membership changes
  useRealtimeSync({
    channel: `event-${eventId}-members`,
    table: 'Membership',
    filter: `eventId=eq.${eventId}`,
    onInsert: () => {
      // Refresh to get full member data (includes person/user relations)
      // Don't optimistically update - need joined data
    },
    onUpdate: payload => {
      // Optimistically update membership (RSVP changes, role changes)
      setMembers(prev =>
        prev.map(m => (m.id === payload.new.id ? { ...m, ...payload.new } : m))
      );
    },
    onDelete: payload => {
      // Optimistically remove member
      setMembers(prev => prev.filter(m => m.id !== payload.old.id));
    },
    refreshOnChange: true, // Always refresh for full data accuracy
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
