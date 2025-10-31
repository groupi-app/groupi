import { InviteDetails } from './components/invite-details';
import { getCurrentUserId } from '@groupi/services';
import { redirect } from 'next/navigation';
import { InviteDetailsSkeleton } from '@/components/skeletons/invite-details-skeleton';
import { Suspense } from 'react';

export default function InvitePage(props: {
  params: Promise<{ inviteId: string }>;
}) {
  return (
    <Suspense fallback={<InviteDetailsSkeleton />}>
      <InviteContent params={props.params} />
    </Suspense>
  );
}

async function InviteContent(props: { params: Promise<{ inviteId: string }> }) {
  'use cache: private';

  const params = await props.params;
  const { inviteId } = params;

  // Auth check (can now safely use headers/cookies)
  const [authError, _userId] = await getCurrentUserId();

  if (authError || !_userId) {
    redirect('/sign-in');
  }

  // InviteDetails is a client component that fetches its own data
  return <InviteDetails inviteId={inviteId} userId={_userId} />;
}
