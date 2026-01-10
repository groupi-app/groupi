import { InviteDetails } from './components/invite-details';
import { getUserId, db, getCachedInviteData } from '@groupi/services/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ inviteId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { inviteId } = await params;
  const [error, inviteData] = await getCachedInviteData(inviteId);

  if (error || !inviteData) {
    return {
      title: 'Invite',
      description: "You've been invited to join an event",
    };
  }

  const eventTitle = inviteData.event.title;
  const eventDescription = inviteData.event.description || '';
  const inviterName = inviteData.createdBy?.person?.user?.name || 'Someone';

  return {
    title: `Join ${eventTitle}`,
    description:
      `${inviterName} invited you to ${eventTitle}. ${eventDescription}`.trim(),
    openGraph: {
      title: `You're invited to ${eventTitle}`,
      description:
        eventDescription || `Join ${inviterName} and others at this event`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `You're invited to ${eventTitle}`,
      description:
        eventDescription || `Join ${inviterName} and others at this event`,
    },
  };
}

/**
 * Invite Page
 *
 * - generateMetadata provides OG tags for social embeds
 * - Streaming redirects for auth and membership checks
 */
export default async function InvitePage({ params }: Props) {
  const { inviteId } = await params;

  // Auth check
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    redirect('/sign-in');
  }

  // Check if user is already a member of the event
  const invite = await db.invite.findUnique({
    where: { id: inviteId },
    select: {
      eventId: true,
      event: {
        select: {
          memberships: {
            where: { personId: userId },
            select: { id: true },
            take: 1,
          },
        },
      },
    },
  });

  // If already a member, redirect to event page
  if (invite?.event.memberships.length) {
    redirect(`/event/${invite.eventId}`);
  }

  // User is authenticated and not yet a member - show invite details
  return (
    <div className='container max-w-4xl py-6'>
      <InviteDetails inviteId={inviteId} />
    </div>
  );
}
