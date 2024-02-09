import { FullPost } from "@/components/full-post";
import { PostData, fetchPostData } from "@/lib/actions/post";
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

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["postData", postId],
    queryFn: async () => data,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FullPost postId={postId} />
    </HydrationBoundary>
  );
}
