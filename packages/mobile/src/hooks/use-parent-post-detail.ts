import { useEffect } from 'react';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { useGlobalUser } from '@/context/global-user-context';

/** The two parent-scoped reads project canonical Posts and Replies into the shared native UI. */
export function useParentPostDetail(
  postId: Id<'posts'>,
  groupId?: Id<'groups'>
) {
  const { person } = useGlobalUser();
  const event = useQuery(
    api.posts.queries.getPostDetail,
    groupId ? 'skip' : { postId }
  );
  const groupPost = useQuery(
    api.groupPosts.queries.getPost,
    groupId ? { postId } : 'skip'
  );
  const groupReplies = usePaginatedQuery(
    api.groupPosts.queries.listReplies,
    groupId && groupPost?.groupId === groupId ? { postId } : 'skip',
    { initialNumItems: 20 }
  );
  const markRead = useMutation(
    api.notifications.mutations.markPostNotificationsAsRead
  );
  const allowed = groupId ? groupPost?.groupId === groupId : !!event?.post;
  useEffect(() => {
    if (allowed) void markRead({ postId }).catch(() => undefined);
  }, [allowed, markRead, postId]);
  if (groupId) {
    if (groupPost === undefined) return undefined;
    if (!groupPost || groupPost.groupId !== groupId) return null;
    return {
      post: { ...groupPost, replies: groupReplies.results },
      canEdit: groupPost.canEdit,
      canDelete: groupPost.canDelete,
      canModerate: groupPost.canModerate,
      canLoadMoreReplies: groupReplies.status === 'CanLoadMore',
      loadMoreReplies: () => groupReplies.loadMore(20),
    };
  }
  if (event === undefined) return undefined;
  if (!event?.post) return null;
  const manager =
    event.userMembership?.role === 'ORGANIZER' ||
    event.userMembership?.role === 'MODERATOR';
  const author = event.post.authorId === person?._id;
  return {
    post: event.post,
    canEdit: author || manager,
    canDelete: author || manager,
    canModerate: manager,
    canLoadMoreReplies: false,
    loadMoreReplies: () => undefined,
  };
}
