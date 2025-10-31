import { PostEditWrapper } from '../components/post-edit-wrapper';
import { getCurrentUserId } from '@groupi/services';
import { redirect } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';

export default function PostEditPage(props: {
  params: Promise<{ postId: string }>;
}) {
  return (
    <Suspense fallback={<Skeleton className='h-screen w-full' />}>
      <PostEditContent params={props.params} />
    </Suspense>
  );
}

async function PostEditContent(props: { params: Promise<{ postId: string }> }) {
  'use cache: private';

  const params = await props.params;
  const { postId } = params;

  // Auth check (can now safely use headers/cookies)
  const [authError, userId] = await getCurrentUserId();

  if (authError || !userId) {
    redirect('/sign-in');
  }

  // PostEditWrapper is a client component that fetches its own data
  return <PostEditWrapper postId={postId} userId={userId} />;
}
