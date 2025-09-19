import { AcceptInviteButton } from './components/invite-accept';
import { InviteDetails } from './components/invite-details';
import { prefetchInvitePageData } from '@groupi/hooks/server';
import { auth } from '@clerk/nextjs/server';
import { HydrationBoundary } from '@tanstack/react-query';
import { redirect } from 'next/navigation';

export default async function InvitePage(props: {
  params: Promise<{ inviteId: string }>;
}) {
  const params = await props.params;
  const { inviteId } = params;
  const { userId }: { userId: string | null } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  try {
    // Prefetch invite page data
    const dehydratedState = await prefetchInvitePageData(inviteId, userId);

    return (
      <HydrationBoundary state={dehydratedState}>
        <InviteDetails inviteId={inviteId} userId={userId} />
      </HydrationBoundary>
    );
  } catch (error) {
    console.error('Error in invite page:', error);
    return (
      <div className='container pt-6'>
        <div className='text-center py-8'>
          <h1 className='text-2xl font-bold text-red-600'>Error</h1>
          <p className='mt-2'>An error occurred while loading the invite.</p>
        </div>
      </div>
    );
  }
}
