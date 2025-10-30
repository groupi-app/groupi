import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { InviteCardList } from '../components/invite-card-list';
import { prefetchEventInvitePageData } from '@groupi/hooks/server';
import { pageLogger } from '@/lib/logger';
import { HydrationBoundary } from '@tanstack/react-query';
import Link from 'next/link';

export default async function EventInvitePage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = await props.params;
  const { eventId } = params;

  try {
    // Prefetch event invite page data
    const dehydratedState = await prefetchEventInvitePageData(eventId);

    return (
      <HydrationBoundary state={dehydratedState}>
        <div className='container max-w-5xl py-4'>
          <Link href={`/event/${eventId}`}>
            <Button variant={'ghost'} className='flex items-center gap-1 pl-2'>
              <Icons.back />
              <span>Back to Event</span>
            </Button>
          </Link>
          <InviteCardList eventId={eventId} />
        </div>
      </HydrationBoundary>
    );
  } catch (error) {
    pageLogger.error({ error }, 'Error in event invite page:');
    return (
      <div className='container pt-6'>
        <div className='text-center py-8'>
          <h1 className='text-2xl font-bold text-red-600'>Error</h1>
          <p className='mt-2'>An error occurred while loading invites.</p>
        </div>
      </div>
    );
  }
}
