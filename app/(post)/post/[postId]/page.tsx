export const dynamic = "force-dynamic";
export const revalidate = 0;

import { FullPost } from "@/components/full-post";
import QueryProvider from "@/components/providers/query-provider";
import Replies from "@/components/replies";
import { markPostNotifsAsRead } from "@/lib/actions/notification";
import { PostData, fetchPostData } from "@/lib/actions/post";
import { getPostQuery } from "@/lib/query-definitions";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";

import { notFound } from "next/navigation";

export default async function Page({ params }: { params: { postId: string } }) {
  const { postId } = params;

  const data = await fetchPostData(postId);

  if (!data) {
    notFound();
  }

  if (data.error) {
    throw new Error(data.error);
  }

  if (!data.success) {
    throw new Error("An error occurred");
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
        <div className="container max-w-4xl">
          <FullPost postId={postId} />
          <Replies postId={postId} />
        </div>
      </HydrationBoundary>
    </QueryProvider>
  );
}
