import { FullPost } from './components/full-post';
import { Replies } from './components/replies';
import { prefetchPostDetailPageData } from '@groupi/hooks/server';
import { markPostNotifsAsRead } from '@groupi/services';
import { auth } from '@clerk/nextjs/server';
import { HydrationBoundary } from '@tanstack/react-query';
import { redirect } from 'next/navigation';

export default async function PostDetailPage(props: {
  params: Promise<{ postId: string }>;
}) {
  const params = await props.params;
  const { postId } = params;
  const { userId }: { userId: string | null } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  try {
    // Prefetch post detail data
    const dehydratedState = await prefetchPostDetailPageData(postId, userId);

    // Mark post notifications as read (fire-and-forget)
    markPostNotifsAsRead(postId, userId).catch(_error => {
      // Silently handle notification read errors
    });

    return (
      <HydrationBoundary state={dehydratedState}>
        <div className='container max-w-4xl'>
          <FullPost postId={postId} />
          <Replies postId={postId} />
        </div>
      </HydrationBoundary>
    );
  } catch (error) {
    console.error('Error in post detail page:', error);
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