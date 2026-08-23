import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Timestamp } from '@/components/molecules';

interface PostCardProps {
  post: {
    _id: string;
    title: string;
    content: string;
    _creationTime: number;
    updatedAt?: number;
    author?: {
      person?: { _id: string; user?: { name: string; image?: string } };
      user?: { name: string; image?: string } | null;
    } | null;
    replyCount?: number;
  };
  eventId: string;
}

export function PostCard({ post, eventId }: PostCardProps) {
  // Handle both author.user and author.person.user shapes
  const authorName =
    post.author?.user?.name ?? post.author?.person?.user?.name ?? 'Unknown';
  const authorImage =
    post.author?.user?.image ?? post.author?.person?.user?.image ?? undefined;
  const replyCount = post.replyCount ?? 0;
  const isEdited =
    post.updatedAt !== undefined && post.updatedAt !== post._creationTime;

  // Strip HTML for preview — show plain text in card
  const plainContent = post.content.replace(/<[^>]*>/g, '').trim();

  return (
    <Pressable
      onPress={() => router.push(`/event/${eventId}/post/${post._id}`)}
      accessibilityRole='button'
      accessibilityLabel={`${post.title}, by ${authorName}, ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`}
      accessibilityHint='Opens post and replies'
    >
      <Card>
        {/* Author row */}
        <View className='flex-row items-center gap-2'>
          <Avatar alt={authorName} className='h-8 w-8'>
            <AvatarImage source={{ uri: authorImage }} />
            <AvatarFallback>
              <Text className='text-xs font-bold text-primary-foreground'>
                {authorName.charAt(0).toUpperCase()}
              </Text>
            </AvatarFallback>
          </Avatar>
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
        {replyCount > 0 ? (
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
