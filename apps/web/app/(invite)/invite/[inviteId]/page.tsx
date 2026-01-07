import { InviteDetails } from './components/invite-details';
import { getUserId, db, getCachedInviteData } from '@groupi/services/server';
import { redirect } from 'next/navigation';
import { InviteDetailsSkeleton } from '@/components/skeletons/invite-details-skeleton';
import { Suspense } from 'react';
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

export default function InvitePage(props: {
  params: Promise<{ inviteId: string }>;
}) {
  return (
    <div className='container max-w-4xl py-6'>
      <Suspense fallback={<InviteDetailsSkeleton />}>
        <InviteContent params={props.params} />
      </Suspense>
    </div>
  );
}

async function InviteContent(props: { params: Promise<{ inviteId: string }> }) {
  // Dynamic rendering - wrapped in Suspense boundary
  const params = await props.params;
  const { inviteId } = params;

  // Auth check - getUserId() handles headers() internally with prerendering detection
  const [authError, userId] = await getUserId();

  if (authError || !userId) {
    redirect('/sign-in');
  }

  // Check if user is already a member of the event this invite is for
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

  // If user is already a member, redirect to the event page
  if (invite?.event.memberships.length) {
    redirect(`/event/${invite.eventId}`);
  }

  // InviteDetails fetches invite data and renders accept form
  return <InviteDetails inviteId={inviteId} />;
}
