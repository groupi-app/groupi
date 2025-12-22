import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { InviteCardList } from '../components/invite-card-list';
import Link from 'next/link';
import { shouldRedirectToAvailability } from '@groupi/services/server';
import { redirect } from 'next/navigation';

export default async function EventInvitePage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = await props.params;
  const { eventId } = params;

  // Check if user should be redirected to availability page
  // Only redirects if there's an active poll (no chosen date) and user hasn't set availability
  const shouldRedirect = await shouldRedirectToAvailability(eventId);
  if (shouldRedirect === true) {
    redirect(`/event/${eventId}/availability`);
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
