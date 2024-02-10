import { PostData, fetchPostData } from "@/lib/actions/post";
import { getPostQuery } from "@/lib/query-definitions";
import { useQuery } from "@tanstack/react-query";

export function usePostDataQuery(
  postId: string,
  select: (data: PostData) => any
) {
  const queryDefinition = getPostQuery(postId);
  return useQuery({
    queryFn: async () => fetchPostData(postId),
    queryKey: [queryDefinition.queryKey],
    select,
  });
}

export function usePostData(postId: string) {
  return usePostDataQuery(postId, (data: PostData) => {
    if (data.error) {
      throw new Error(data.error);
    }
    if (data.success) {
      return data.success;
    }
  });
}
