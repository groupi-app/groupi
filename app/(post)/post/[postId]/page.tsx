export const dynamic = 'force-dynamic';
export const revalidate = 0;

import ErrorPage from '@/components/error';
import { FullPost } from '@/components/full-post';
import QueryProvider from '@/components/providers/query-provider';
import Replies from '@/components/replies';
import { markPostNotifsAsRead } from '@/lib/actions/notification';
import { fetchPostData } from '@/lib/actions/post';
import { getPostQuery } from '@/lib/query-definitions';
import { auth } from '@clerk/nextjs/server';
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query';

import { notFound } from 'next/navigation';

export default async function Page(props: {
  params: Promise<{ postId: string }>;
}) {
  const params = await props.params;
  const { postId } = params;
  const { userId }: { userId: string | null } = await auth();

  if (!userId) {
    return <ErrorPage message={'User not found'} />;
  }

  const data = await fetchPostData(postId);

  if (!data) {
    notFound();
  }

  if (data.error) {
    return <ErrorPage message={data.error} />;
  }

  if (!data.success) {
    return <ErrorPage message={'Post not found'} />;
  }

  const queryDefinition = getPostQuery(postId);

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: [queryDefinition.queryKey],
    queryFn: async () => data,
    staleTime: 0,
  });

  await markPostNotifsAsRead(postId);

  return (
    <QueryProvider queryDefinition={queryDefinition}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <div className='container max-w-4xl'>
          <FullPost postId={postId} />
          <Replies postId={postId} userId={userId} />
        </div>
      </HydrationBoundary>
    </QueryProvider>
  );
}
