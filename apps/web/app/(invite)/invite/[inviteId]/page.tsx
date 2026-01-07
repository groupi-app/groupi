import { InviteDetails } from './components/invite-details';
import { getUserId, db } from '@groupi/services/server';
import { redirect } from 'next/navigation';
import { InviteDetailsSkeleton } from '@/components/skeletons/invite-details-skeleton';
import { Suspense } from 'react';

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

  // InviteDetails is a client component that fetches its own data
  return <InviteDetails inviteId={inviteId} userId={userId} />;
}
