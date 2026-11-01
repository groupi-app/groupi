import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { View } from 'react-native';
import type { Id } from 'convex/_generated/dataModel';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { NewPostScreen } from '../posts/new-post-screen';
import { PostDetailScreen } from '../posts/post-detail-screen';
import { EditPostScreen } from '../posts/edit-post-screen';
import { useGlobalUser } from '@/context/global-user-context';
import { PostCard } from '../posts/post-card';
import { useGroup } from '@/hooks/use-groups';
import * as hooks from '@/hooks/use-group-posts';
export function GroupPosts({ groupId }: { groupId: Id<'groups'> }) {
  const group = useGroup(groupId);
  const { person } = useGlobalUser();
  const [cursor, setCursor] = useState<string | null>(null);
  const eligible =
    group && group.joiningQuestionnaire?.canAccessMemberContent !== false;
  const pinned = useQuery(
    api.groupPosts.queries.listPinnedPosts,
    eligible ? { groupId } : 'skip'
  );
  const posts = hooks.useGroupPosts(
    eligible
      ? {
          groupId,
          excludePinned: true,
          paginationOpts: { numItems: 20, cursor },
        }
      : 'skip'
  );
  const pinnedIds = new Set((pinned ?? []).map(post => post._id));
  const visiblePosts = [
    ...(pinned ?? []),
    ...(posts?.page ?? []).filter(post => !pinnedIds.has(post._id)),
  ];
  if (group === undefined) return <Text>Loading Group…</Text>;
  if (!eligible)
    return (
      <Text>
        Current Group membership and completed required onboarding are needed to
        view posts.
      </Text>
    );
  return (
    <View className='gap-4'>
      <Text
        accessibilityRole='header'
        className='font-heading text-2xl font-bold'
      >
        Posts
      </Text>
      {posts === undefined ? (
        <Text>Loading posts…</Text>
      ) : (
        <>
          {!visiblePosts.length && <Text>No posts yet.</Text>}
          {visiblePosts.map(post => (
            <PostCard
              key={post._id}
              post={post}
              groupId={groupId}
              currentPersonId={person?._id ?? ''}
              userRole={group?.viewerRole}
            />
          ))}
          {!posts.isDone && (
            <Button
              variant='outline'
              onPress={() => setCursor(posts.continueCursor)}
            >
              <Text>Next posts</Text>
            </Button>
          )}
          {cursor && (
            <Button variant='ghost' onPress={() => setCursor(null)}>
              <Text>Newest posts</Text>
            </Button>
          )}
        </>
      )}
    </View>
  );
}
export function GroupPostDetail({
  groupId,
  postId,
}: {
  groupId: Id<'groups'>;
  postId: Id<'posts'>;
}) {
  return <PostDetailScreen groupId={groupId} postId={postId} />;
}
export function GroupPostEditor({
  groupId,
  postId,
}: {
  groupId: Id<'groups'>;
  postId?: Id<'posts'>;
}) {
  return postId ? (
    <EditPostScreen groupId={groupId} postId={postId} />
  ) : (
    <NewPostScreen groupId={groupId} />
  );
}
