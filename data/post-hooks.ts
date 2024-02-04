import { PostData, fetchPostData } from "@/lib/actions/post";
import { useQuery } from "@tanstack/react-query";

export function usePostDataQuery(postId: string, select: (data: PostData) => any) {
    return useQuery({
      queryFn: async () => fetchPostData(postId),
      queryKey: ["postData"],
      select
    });
  }

export function usePostData(postId: string) {
    return usePostDataQuery(postId, (data:PostData) => {
      if (data.error) {
        throw new Error(data.error);
      }
      if (data.success) {
        return data.success
      }
    });
  }