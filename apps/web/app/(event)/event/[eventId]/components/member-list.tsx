'use client';
import MemberIcon from './member-icon';
import { useMemberList } from '@groupi/hooks';
import { getFullName } from '@/lib/utils';
import { EventPageDTO } from '@groupi/schema';
import { Member } from '@/types';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLayoutEffect, useRef, useState } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';

// Adapter function to convert DTO structure to old Member interface
function adaptMembershipToMember(
  membership: EventPageDTO['memberships'][number],
  eventId: string
): Member {
  return {
    id: membership.id,
    role: membership.role,
    rsvpStatus: membership.rsvpStatus,
    personId: membership.person.id,
    eventId: eventId,
    person: {
      id: membership.person.id,
      createdAt: new Date(), // Placeholder - component doesn't actually use this
      updatedAt: new Date(), // Placeholder - component doesn't actually use this
      firstName: membership.person.firstName,
      lastName: membership.person.lastName,
      username: membership.person.username,
      imageUrl: membership.person.imageUrl,
    },
  };
}

export function MemberList({ eventId }: { eventId: string }) {
  const { data, isLoading } = useMemberList(eventId);

  // Move hooks before conditional returns - Rules of Hooks
  const ref = useRef<HTMLDivElement>(null);
  const [visibleIcons, setVisibleIcons] = useState(100);
  const pathname = usePathname();

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

  if (isLoading || !data) {
    return <div>Loading...</div>;
  }

  const [error, memberListData] = data;

  if (error) {
    switch (error._tag) {
      case 'EventNotFoundError':
        return <div>Event not found</div>;
      case 'EventUserNotFoundError':
        return <div>User not found</div>;
      case 'EventUserNotMemberError':
        return <div>You are not a member of this event</div>;
      default:
        return <div>Error loading members</div>;
    }
  }

  // If error is null, memberListData is guaranteed to exist

  const event = memberListData.event;
  const userMembership = memberListData.userMembership;
  const userId = memberListData.userId;

  const members = event.memberships;
  const eventDateTime = event.chosenDateTime;
  const userRole = userMembership.role;

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

  const sortByRole = (
    a: EventPageDTO['memberships'][number],
    b: EventPageDTO['memberships'][number]
  ) => {
    return (
      (b.role === 'ORGANIZER' ? 3 : b.role === 'MODERATOR' ? 2 : 1) -
        (a.role === 'ORGANIZER' ? 3 : a.role === 'MODERATOR' ? 2 : 1) ||
      getFullName(a.person.firstName, a.person.lastName).localeCompare(
        getFullName(b.person.firstName, b.person.lastName)
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
              .map(
                (
                  membership: EventPageDTO['memberships'][number],
                  i: number
                ) => {
                  const adaptedMember = adaptMembershipToMember(
                    membership,
                    eventId
                  );
                  return i < visibleIcons - 1 ? (
                    <MemberIcon
                      userId={userId}
                      userRole={userRole}
                      member={adaptedMember}
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
                }
              )}
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
