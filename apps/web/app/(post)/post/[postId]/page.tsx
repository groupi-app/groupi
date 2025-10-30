import { FullPost } from './components/full-post';
import { Replies } from './components/replies';
import { prefetchPostDetailPageData } from '@groupi/hooks/server';
import { getCurrentUserId } from '@groupi/services';
import { redirect } from 'next/navigation';
import { HydrationBoundary } from '@tanstack/react-query';
import { pageLogger } from '@/lib/logger';

export default async function PostDetailPage(props: {
  params: Promise<{ postId: string }>;
}) {
  const params = await props.params;
  const { postId } = params;

  // Validate session server-side
  const [authError, userId] = await getCurrentUserId();

  if (authError || !userId) {
    redirect('/sign-in');
  }

  try {
    // Prefetch post detail data
    // Services will get userId internally via getCurrentUserId()
    const dehydratedState = await prefetchPostDetailPageData(postId);

    // Marking post notifications has been removed from this path

    return (
      <HydrationBoundary state={dehydratedState}>
        <div className='container max-w-4xl'>
          <FullPost postId={postId} />
          <Replies postId={postId} />
        </div>
      </HydrationBoundary>
    );
  } catch (error: unknown) {
    pageLogger.error({ error }, 'Error in post page');
    return (
      <div className='container pt-6'>
        <div className='text-center py-8'>
          <h1 className='text-2xl font-bold text-red-600'>Error</h1>
          <p className='mt-2'>An error occurred while loading the post.</p>
        </div>
      </div>
    );
  }
}
