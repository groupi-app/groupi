import { fetchPostPageData, fetchReplyFeedData, createPost, updatePost, deletePost, } from '@groupi/services';
import { getPostQuery } from '@groupi/schema/queries';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
export function usePostPageQuery(postId, select) {
    const queryDefinition = getPostQuery(postId);
    return useQuery({
        queryFn: async () => fetchPostPageData(postId),
        queryKey: [queryDefinition.queryKey],
        select,
    });
}
export function usePostReplyFeedQuery(postId, select) {
    const queryDefinition = getPostQuery(postId);
    return useQuery({
        queryFn: async () => fetchReplyFeedData(postId),
        queryKey: [`${queryDefinition.queryKey}-reply-feed`],
        select,
    });
}
export function usePostPage(postId) {
    return usePostPageQuery(postId, (data) => {
        if (data.error) {
            return {
                error: data.error,
            };
        }
        if (data.success) {
            return {
                post: data.success.post,
                userId: data.success.userId,
                userRole: data.success.userRole,
            };
        }
    });
}
export function usePostReplyFeed(postId) {
    return usePostReplyFeedQuery(postId, (data) => {
        if (data.error) {
            return {
                error: data.error,
            };
        }
        if (data.success) {
            return {
                post: data.success.post,
                userId: data.success.userId,
                userRole: data.success.userRole,
            };
        }
    });
}
export function usePostRepliesAndMembers(postId) {
    return usePostReplyFeedQuery(postId, (data) => {
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
export function useCreatePost() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ title, content, eventId, }) => createPost({ title, content, eventId }),
        onSuccess: (data, variables) => {
            if (data.success) {
                // Invalidate event queries to refetch posts
                queryClient.invalidateQueries({
                    queryKey: ['event', variables.eventId],
                });
            }
        },
    });
}
export function useUpdatePost() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, title, content, }) => updatePost({ id, title, content }),
        onSuccess: (data, variables) => {
            if (data.success) {
                // Invalidate post queries
                queryClient.invalidateQueries({
                    queryKey: ['post', variables.id],
                });
            }
        },
    });
}
export function useDeletePost() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id }) => deletePost({ id }),
        onSuccess: (data, variables) => {
            if (data.success) {
                // Invalidate post queries
                queryClient.invalidateQueries({
                    queryKey: ['post', variables.id],
                });
            }
        },
    });
}
// Backward compatibility aliases
export const usePostData = usePostPage;
export const usePostWithEventData = usePostReplyFeed;
export const usePostReplies = usePostRepliesAndMembers;
