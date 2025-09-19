import { Editor } from '../components/editor';
import { PostEditWrapper } from '../components/post-edit-wrapper';
import { prefetchPostDetailPageData } from '@groupi/hooks/server';
import { auth } from '@clerk/nextjs/server';
import { HydrationBoundary } from '@tanstack/react-query';
import { redirect } from 'next/navigation';

export default async function PostEditPage(props: {
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

    return (
      <HydrationBoundary state={dehydratedState}>
        <PostEditWrapper postId={postId} userId={userId} />
      </HydrationBoundary>
    );
  } catch (error) {
    console.error('Error in post edit page:', error);
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