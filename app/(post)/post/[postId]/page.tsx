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

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["postData"],
    queryFn: async () => fetchPostData(postId),
  });

  const data: PostData | undefined = queryClient.getQueryData(["postData"]);

  if (!data) {
    notFound();
  }

  if (data.error) {
    throw new Error(data.error);
  }

  if (!data.success) {
    throw new Error("An error occurred");
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FullPost postId={postId} />
    </HydrationBoundary>
  );
}
