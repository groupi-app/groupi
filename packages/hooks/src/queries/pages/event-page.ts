import { api } from '../clients/trpc-client';
import { useSupabaseRealtime } from '../realtime/use-supabase-realtime';
import type {
  EventHeaderResult,
  MemberListResult,
  PostFeedResult,
} from '@groupi/schema';

// ============================================================================
// EVENT PAGE COMPONENT HOOKS
// ============================================================================

/**
 * Hook for EventHeader component
 * Fetches only the data needed for event header display
 * Includes built-in real-time sync via Supabase
 */
export function useEventHeader(eventId: string) {
  // Standard tRPC query
  const query = api.event.getHeaderData.useQuery(
    { id: eventId },
    {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: false,
    }
  );

  // Real-time sync for event changes
  useSupabaseRealtime(
    {
      channel: `event-header-${eventId}`,
      changes: [
        {
          table: 'Event',
          filter: `id=eq.${eventId}`,
          event: '*',
          handler: ({ payload, queryClient }) => {
            queryClient.setQueryData(
              [
                ['event', 'getHeaderData'],
                { input: { id: eventId }, type: 'query' },
              ],
              (oldValue: EventHeaderResult | undefined) => {
                if (!oldValue) return oldValue;
                const [error, data] = oldValue;
                if (error || !data) return oldValue;

                // Update event data with new values
                return [
                  null,
                  {
                    ...data,
                    event: { ...data.event, ...payload.new },
                  },
                ] as EventHeaderResult;
              }
            );
          },
        },
        {
          table: 'Membership',
          filter: `eventId=eq.${eventId}`,
          event: '*',
          handler: ({ payload, queryClient }) => {
            queryClient.setQueryData(
              [
                ['event', 'getHeaderData'],
                { input: { id: eventId }, type: 'query' },
              ],
              (oldValue: EventHeaderResult | undefined) => {
                if (!oldValue) return oldValue;
                const [error, data] = oldValue;
                if (error || !data) return oldValue;

                // Update membership data if it matches the current user
                if (payload.new?.id === data.userMembership.id) {
                  return [
                    null,
                    {
                      ...data,
                      userMembership: {
                        ...data.userMembership,
                        ...payload.new,
                      },
                    },
                  ] as EventHeaderResult;
                }
                return oldValue;
              }
            );
          },
        },
      ],
    },
    [eventId]
  );

  return {
    data: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
    realTime: { isConnected: true, isEnabled: true },
  };
}

/**
 * Hook for MemberList component
 * Fetches only the data needed for member list display
 * Includes built-in real-time sync via Supabase
 */
export function useMemberList(eventId: string) {
  // Standard tRPC query
  const query = api.event.getMemberListData.useQuery(
    { id: eventId },
    {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: false,
    }
  );

  // Real-time sync for membership changes
  useSupabaseRealtime(
    {
      channel: `member-list-${eventId}`,
      changes: [
        {
          table: 'Membership',
          filter: `eventId=eq.${eventId}`,
          event: '*',
          handler: ({ payload, queryClient }) => {
            queryClient.setQueryData(
              [
                ['event', 'getMemberListData'],
                { input: { id: eventId }, type: 'query' },
              ],
              (oldValue: MemberListResult | undefined) => {
                if (!oldValue) return oldValue;
                const [error, data] = oldValue;
                if (error || !data) return oldValue;

                // Handle membership changes
                const memberships = [...data.event.memberships];
                const membershipIndex = memberships.findIndex(
                  m => m.id === payload.old?.id || m.id === payload.new?.id
                );

                if (payload.eventType === 'INSERT' && payload.new) {
                  // Add new membership (need to fetch person data)
                  queryClient.invalidateQueries({
                    queryKey: [
                      ['event', 'getMemberListData'],
                      { input: { id: eventId }, type: 'query' },
                    ],
                  });
                } else if (
                  payload.eventType === 'UPDATE' &&
                  payload.new &&
                  membershipIndex >= 0
                ) {
                  // Update existing membership
                  memberships[membershipIndex] = {
                    ...memberships[membershipIndex],
                    ...payload.new,
                  };
                  return [
                    null,
                    {
                      ...data,
                      event: { ...data.event, memberships },
                    },
                  ] as MemberListResult;
                } else if (
                  payload.eventType === 'DELETE' &&
                  membershipIndex >= 0
                ) {
                  // Remove membership
                  memberships.splice(membershipIndex, 1);
                  return [
                    null,
                    {
                      ...data,
                      event: { ...data.event, memberships },
                    },
                  ] as MemberListResult;
                }

                return oldValue;
              }
            );
          },
        },
        {
          table: 'Person',
          filter: `id=in.(${query.data?.[1]?.event.memberships.map(m => m.person.id).join(',') || ''})`,
          event: '*',
          handler: ({ payload, queryClient }) => {
            queryClient.setQueryData(
              [
                ['event', 'getMemberListData'],
                { input: { id: eventId }, type: 'query' },
              ],
              (oldValue: MemberListResult | undefined) => {
                if (!oldValue) return oldValue;
                const [error, data] = oldValue;
                if (error || !data) return oldValue;

                // Update person data in memberships
                const memberships = data.event.memberships.map(membership => {
                  if (membership.person.id === payload.new?.id) {
                    return {
                      ...membership,
                      person: { ...membership.person, ...payload.new },
                    };
                  }
                  return membership;
                });

                return [
                  null,
                  {
                    ...data,
                    event: { ...data.event, memberships },
                  },
                ] as MemberListResult;
              }
            );
          },
        },
      ],
    },
    [eventId]
  );

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    realTime: { isConnected: true, isEnabled: true },
  };
}

/**
 * Hook for PostFeed component
 * Fetches only the data needed for post feed display
 * Includes built-in real-time sync via Supabase
 */
export function usePostFeed(eventId: string) {
  // Standard tRPC query
  const query = api.event.getPostFeedData.useQuery(
    { id: eventId },
    {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: false,
    }
  );

  // Real-time sync for post changes
  useSupabaseRealtime(
    {
      channel: `post-feed-${eventId}`,
      changes: [
        {
          table: 'Post',
          filter: `eventId=eq.${eventId}`,
          event: '*',
          handler: ({ payload, queryClient }) => {
            queryClient.setQueryData(
              [
                ['event', 'getPostFeedData'],
                { input: { id: eventId }, type: 'query' },
              ],
              (oldValue: PostFeedResult | undefined) => {
                if (!oldValue) return oldValue;
                const [error, data] = oldValue;
                if (error || !data) return oldValue;

                // Handle post changes
                const posts = [...data.event.posts];
                const postIndex = posts.findIndex(
                  p => p.id === payload.old?.id || p.id === payload.new?.id
                );

                if (payload.eventType === 'INSERT' && payload.new) {
                  // Add new post (need to fetch author data)
                  queryClient.invalidateQueries({
                    queryKey: [
                      ['event', 'getPostFeedData'],
                      { input: { id: eventId }, type: 'query' },
                    ],
                  });
                } else if (
                  payload.eventType === 'UPDATE' &&
                  payload.new &&
                  postIndex >= 0
                ) {
                  // Update existing post
                  posts[postIndex] = { ...posts[postIndex], ...payload.new };
                  // Sort posts by updatedAt
                  posts.sort(
                    (a, b) =>
                      new Date(b.updatedAt).getTime() -
                      new Date(a.updatedAt).getTime()
                  );
                  return [
                    null,
                    {
                      ...data,
                      event: { ...data.event, posts },
                    },
                  ] as PostFeedResult;
                } else if (payload.eventType === 'DELETE' && postIndex >= 0) {
                  // Remove post
                  posts.splice(postIndex, 1);
                  return [
                    null,
                    {
                      ...data,
                      event: { ...data.event, posts },
                    },
                  ] as PostFeedResult;
                }

                return oldValue;
              }
            );
          },
        },
        {
          table: 'Reply',
          filter: `postId=in.(${query.data?.[1]?.event.posts.map(p => p.id).join(',') || ''})`,
          event: '*',
          handler: ({ payload, queryClient }) => {
            queryClient.setQueryData(
              [
                ['event', 'getPostFeedData'],
                { input: { id: eventId }, type: 'query' },
              ],
              (oldValue: PostFeedResult | undefined) => {
                if (!oldValue) return oldValue;
                const [error, data] = oldValue;
                if (error || !data) return oldValue;

                // Update reply count for affected post
                const posts = data.event.posts.map(post => {
                  if (
                    payload.new?.postId === post.id ||
                    payload.old?.postId === post.id
                  ) {
                    const countChange =
                      payload.eventType === 'INSERT'
                        ? 1
                        : payload.eventType === 'DELETE'
                          ? -1
                          : 0;
                    return {
                      ...post,
                      _count: {
                        replies: Math.max(0, post._count.replies + countChange),
                      },
                    };
                  }
                  return post;
                });

                return [
                  null,
                  {
                    ...data,
                    event: { ...data.event, posts },
                  },
                ] as PostFeedResult;
              }
            );
          },
        },
        {
          table: 'Person',
          filter: `id=in.(${query.data?.[1]?.event.posts.map(p => p.author.id).join(',') || ''})`,
          event: '*',
          handler: ({ payload, queryClient }) => {
            queryClient.setQueryData(
              [
                ['event', 'getPostFeedData'],
                { input: { id: eventId }, type: 'query' },
              ],
              (oldValue: PostFeedResult | undefined) => {
                if (!oldValue) return oldValue;
                const [error, data] = oldValue;
                if (error || !data) return oldValue;

                // Update author data in posts
                const posts = data.event.posts.map(post => {
                  if (post.author.id === payload.new?.id) {
                    return {
                      ...post,
                      author: { ...post.author, ...payload.new },
                    };
                  }
                  return post;
                });

                return [
                  null,
                  {
                    ...data,
                    event: { ...data.event, posts },
                  },
                ] as PostFeedResult;
              }
            );
          },
        },
      ],
    },
    [eventId]
  );

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    realTime: { isConnected: true, isEnabled: true },
  };
}
