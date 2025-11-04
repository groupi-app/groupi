import { PostEditWrapper } from '../components/post-edit-wrapper';
import { getUserId } from '@groupi/services';
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
  // Dynamic rendering - wrapped in Suspense boundary
  const params = await props.params;
  const { postId } = params;

  // Auth check - getUserId() handles headers() internally with prerendering detection
  const [authError, userId] = await getUserId();

  if (authError || !userId) {
    redirect('/sign-in');
  }

  // PostEditWrapper is a client component that fetches its own data
  return <PostEditWrapper postId={postId} userId={userId} />;
}
