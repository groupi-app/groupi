'use client';

import MemberIcon from '@/components/member-icon';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLayoutEffect, useRef, useState } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Id, Doc } from '@/convex/_generated/dataModel';
import { User } from '@/convex/types';
import { useEventMembers } from '@/hooks/convex';

// Match the Member type expected by MemberIcon
type Membership = Doc<'memberships'> & {
  person:
    | (Doc<'persons'> & {
        user: User;
      })
    | null;
};

interface MemberListProps {
  eventId: string;
}

/**
 * Client component with direct Convex hooks - Client-only pattern
 * - Uses useEventMembers hook for real-time member data
 * - Real-time updates via Convex subscriptions
 * - Loading states managed by component
 */
export function MemberList({ eventId }: MemberListProps) {
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP
  const ref = useRef<HTMLDivElement>(null);
  const [visibleIcons, setVisibleIcons] = useState(100);
  const pathname = usePathname();

  // Use direct Convex hook for real-time member data
  const eventAttendeesData = useEventMembers(eventId as Id<'events'>);

  // useLayoutEffect must be called unconditionally
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

  // Loading state - AFTER all hooks are called
  if (eventAttendeesData === undefined) {
    return (
      <div>
        <div className='flex items-center gap-2 mb-4'>
          <h2 className='text-xl font-heading font-medium'>Attendees</h2>
          <div className='rounded-full p-[.3rem] flex items-center justify-center text-xs bg-muted text-muted-foreground'>
            <div className='h-4 w-6 bg-muted rounded animate-pulse'></div>
          </div>
        </div>
        <div className='flex items-center p-2 -space-x-2 h-[54px]'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className='h-10 w-10 rounded-full bg-muted animate-pulse'
            ></div>
          ))}
        </div>
      </div>
    );
  }

  const { event, userMembership, userId } = eventAttendeesData;
  const members = event.memberships;
  const userRole = userMembership.role;
  const eventDateTime = event.chosenDateTime
    ? new Date(event.chosenDateTime)
    : null;

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
      (a.person?.user?.name || a.person?.user?.email || '').localeCompare(
        b.person?.user?.name || b.person?.user?.email || ''
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
                    key={membership._id}
                    itemKey={membership._id}
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
