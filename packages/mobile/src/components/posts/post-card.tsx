import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import type { Id } from 'convex/_generated/dataModel';
import { MemberAvatar } from '@/components/members/member-avatar';
import { Timestamp } from '@/components/molecules';
import {
  useActionMenu,
  type ActionMenuOption,
} from '@/components/ui/action-menu';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { useDeletePost } from '@/hooks/use-posts';
import { useIsPostMuted, useTogglePostMute } from '@/hooks/use-muting';
import { useCreateReport } from '@/hooks/use-reports';
import { toast } from '@groupi/shared/platform';

export interface PostCardProps {
  post: {
    _id: string;
    title: string;
    content: string;
    _creationTime: number;
    updatedAt?: number;
    authorId: string;
    author?: {
      name?: string | null;
      image?: string | null;
      person?: { _id: string; user?: { name: string; image?: string } };
      user?: { name: string; image?: string } | null;
    } | null;
    replyCount?: number;
  };
  eventId: string;
  currentPersonId: string;
  userRole?: string;
}

export function PostCard({
  post,
  eventId,
  currentPersonId,
  userRole,
}: PostCardProps) {
  // Handle both author.user and author.person.user shapes
  const authorName =
    post.author?.name ??
    post.author?.user?.name ??
    post.author?.person?.user?.name ??
    'Unknown';
  const authorImage =
    post.author?.image ??
    post.author?.user?.image ??
    post.author?.person?.user?.image ??
    undefined;
  const replyCount = post.replyCount;
  const isEdited =
    post.updatedAt !== undefined && post.updatedAt !== post._creationTime;
  const isAuthor = post.authorId === currentPersonId;
  const canModerate = userRole === 'ORGANIZER' || userRole === 'MODERATOR';
  const mutedState = useIsPostMuted(post._id);
  const isMuted = mutedState?.isMuted ?? false;
  const togglePostMute = useTogglePostMute();
  const deletePost = useDeletePost();
  const createReport = useCreateReport();
  const { showActionMenu } = useActionMenu();

  // Strip HTML for preview — show plain text in card
  const plainContent = post.content.replace(/<[^>]*>/g, '').trim();

  function handleLongPress() {
    const options: ActionMenuOption[] = [
      {
        label: isMuted ? 'Unmute Post' : 'Mute Post',
        icon: isMuted ? 'notifications-outline' : 'notifications-off-outline',
        onPress: () => togglePostMute(post._id),
      },
    ];

    if (isAuthor) {
      options.push({
        label: 'Edit Post',
        icon: 'create-outline',
        showChevron: true,
        onPress: () => router.push(`/event/${eventId}/post/${post._id}/edit`),
      });
    } else {
      options.push({
        label: 'Report Post',
        icon: 'flag-outline',
        onPress: () =>
          createReport({
            targetType: 'POST',
            targetId: post._id,
            reason: 'INAPPROPRIATE_CONTENT',
          }),
      });
    }

    if (isAuthor || canModerate) {
      options.push({
        label: 'Delete Post',
        icon: 'trash-outline',
        destructive: true,
        onPress: () =>
          showConfirmDialog({
            title: 'Delete Post',
            message: 'This will also delete all replies. Are you sure?',
            confirmLabel: 'Delete',
            destructive: true,
            onConfirm: async () => {
              try {
                await deletePost({ postId: post._id as Id<'posts'> });
                toast.success('Post deleted');
              } catch {
                toast.error('Failed to delete post');
              }
            },
          }),
      });
    }

    showActionMenu({ title: post.title, options });
  }

  return (
    <Pressable
      onPress={() => router.push(`/event/${eventId}/post/${post._id}`)}
      onLongPress={handleLongPress}
      accessibilityRole='button'
      accessibilityLabel={`${post.title}, by ${authorName}${replyCount === undefined ? '' : `, ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`}`}
      accessibilityHint='Opens post and replies. Long press for post actions.'
    >
      <Card>
        {/* Author row */}
        <View className='flex-row items-center gap-2'>
          <MemberAvatar
            personId={post.authorId as Id<'persons'>}
            src={authorImage}
            name={authorName}
            size='sm'
          />
          <View className='flex-1'>
            <Text variant='small'>{authorName}</Text>
            <View className='flex-row items-center gap-1'>
              <Timestamp time={post._creationTime} className='text-xs' />
              {isEdited ? (
                <Text className='text-xs text-muted-foreground'>(edited)</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Title */}
        <Text className='mt-2 text-base font-semibold' numberOfLines={2}>
          {post.title}
        </Text>

        {/* Content preview — always show plain text in card */}
        <Text variant='muted' className='mt-1 text-sm' numberOfLines={3}>
          {plainContent || post.content}
        </Text>

        {/* Reply count */}
        {replyCount !== undefined && replyCount > 0 ? (
          <View className='mt-3 flex-row items-center gap-1'>
            <Ionicons name='chatbubble-outline' size={14} color='#9ca3af' />
            <Text variant='muted' className='text-sm'>
              {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
            </Text>
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}
