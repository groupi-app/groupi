import { PostData, fetchPostData } from '@/lib/actions/post';
import { getPostQuery } from '@/lib/query-definitions';
import { useQuery } from '@tanstack/react-query';

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
      return {
        error: data.error,
      };
    }
    if (data.success) {
      return data.success;
    }
  });
}

export function usePostReplies(postId: string) {
  return usePostDataQuery(postId, (data: PostData) => {
    if (data.error) {
      return {
        error: data.error,
      };
    }
    if (data.success) {
      return {
        replies: data.success.post.replies,
        members: data.success.post.event.memberships,
        userId: data.success.userId,
        userRole: data.success.userRole,
        eventDateTime: data.success.post.event.chosenDateTime,
      };
    }
  });
}
