import { getCachedEventInviteData } from '@groupi/services/server';
import { InviteCardListClient } from './invite-card-list-client';
import { redirect } from 'next/navigation';

export async function InviteCardList({ eventId }: { eventId: string }) {
  const [error, inviteData] = await getCachedEventInviteData(eventId);

  if (error) {
    switch (error._tag) {
      case 'NotFoundError':
        return <div>Event not found</div>;
      case 'AuthenticationError':
        redirect('/sign-in');

      case 'UnauthorizedError':
        return <div>You are not a member of this event</div>;
      default:
        return <div>Error loading invites</div>;
    }
  }

  return <InviteCardListClient eventId={eventId} initialData={inviteData} />;
}
