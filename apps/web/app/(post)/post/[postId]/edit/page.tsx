import { PostEditWrapper } from '../components/post-edit-wrapper';
import { getCurrentUserId } from '@groupi/services';
import { redirect } from 'next/navigation';
import { prefetchPostDetailPageData } from '@groupi/hooks/server';
import { HydrationBoundary } from '@tanstack/react-query';
import { pageLogger } from '@/lib/logger';

export default async function PostEditPage(props: {
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
    const dehydratedState = await prefetchPostDetailPageData(postId);

    return (
      <HydrationBoundary state={dehydratedState}>
        <PostEditWrapper postId={postId} userId={userId} />
      </HydrationBoundary>
    );
  } catch (error) {
    pageLogger.error({ error }, 'Error in post edit page');
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
