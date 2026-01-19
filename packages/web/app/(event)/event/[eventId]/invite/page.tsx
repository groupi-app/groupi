'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEventHeaderData } from '@/hooks/convex';
import { Id } from '@/convex/_generated/dataModel';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { InviteCardList } from '../components/invite-card-list';
import { InvitePageSkeleton } from '@/components/skeletons';
import Link from 'next/link';

export default function EventInvitePage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const [eventId, setEventId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    props.params.then(p => setEventId(p.eventId));
  }, [props.params]);

  const eventData = useEventHeaderData(eventId as Id<"events">);

  // Check if user should be redirected to availability page
  useEffect(() => {
    if (eventData) {
      const userRole = eventData.userMembership?.role;
      const hasChosenDate = !!eventData.event.chosenDateTime;

      // Only redirect if there's no chosen date and user is a member
      if (!hasChosenDate && userRole && ['ORGANIZER', 'MODERATOR', 'ATTENDEE'].includes(userRole)) {
        router.push(`/event/${eventId}/availability`);
      }
    }
  }, [eventData, eventId, router]);

  if (!eventId) {
    return <InvitePageSkeleton />;
  }

  // Note: InviteCardList handles authorization checks internally
  // Only ORGANIZER and MODERATOR roles can manage invites

  return (
    <div className='container max-w-5xl py-4'>
      <Link href={`/event/${eventId}`}>
        <Button variant={'ghost'} className='flex items-center gap-1 pl-2'>
          <Icons.back />
          <span>Back to Event</span>
        </Button>
      </Link>
      <InviteCardList eventId={eventId} />
    </div>
  );
}
