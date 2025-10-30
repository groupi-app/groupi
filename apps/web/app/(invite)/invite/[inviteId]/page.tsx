import { InviteDetails } from './components/invite-details';
import { prefetchInvitePageData } from '@groupi/hooks/server';
import { getCurrentUserId } from '@groupi/services';
import { redirect } from 'next/navigation';
import { HydrationBoundary } from '@tanstack/react-query';
import { pageLogger } from '@/lib/logger';

export default async function InvitePage(props: {
  params: Promise<{ inviteId: string }>;
}) {
  const params = await props.params;
  const { inviteId } = params;

  // Validate session server-side
  const [authError, _userId] = await getCurrentUserId();

  if (authError || !_userId) {
    redirect('/sign-in');
  }

  try {
    // Prefetch invite page data
    // Services will get userId internally via getCurrentUserId()
    const dehydratedState = await prefetchInvitePageData(inviteId);

    return (
      <HydrationBoundary state={dehydratedState}>
        <InviteDetails inviteId={inviteId} userId={_userId} />
      </HydrationBoundary>
    );
  } catch (error) {
    pageLogger.error({ error }, 'Error in invite page');
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
