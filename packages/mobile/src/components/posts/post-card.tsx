import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface PostCardProps {
  post: {
    _id: string;
    title: string;
    content: string;
    _creationTime: number;
    author?: {
      person?: { _id: string };
      user?: { name: string; image?: string };
    };
    replyCount?: number;
  };
  eventId: string;
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function PostCard({ post, eventId }: PostCardProps) {
  const authorName = post.author?.user?.name ?? 'Unknown';
  const authorImage = post.author?.user?.image;
  const replyCount = post.replyCount ?? 0;

  return (
    <Pressable
      onPress={() => router.push(`/event/${eventId}/post/${post._id}`)}
    >
      <Card>
        {/* Author row */}
        <View className='flex-row items-center gap-2'>
          <Avatar alt={authorName} className='h-8 w-8'>
            <AvatarImage source={{ uri: authorImage ?? undefined }} />
            <AvatarFallback>
              <Text className='text-xs font-bold text-primary-foreground'>
                {authorName.charAt(0).toUpperCase()}
              </Text>
            </AvatarFallback>
          </Avatar>
          <View className='flex-1'>
            <Text variant='small'>{authorName}</Text>
            <Text variant='muted' className='text-xs'>
              {formatTimeAgo(post._creationTime)}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text className='mt-2 text-base font-semibold' numberOfLines={2}>
          {post.title}
        </Text>

        {/* Content preview */}
        <Text variant='muted' className='mt-1 text-sm' numberOfLines={3}>
          {post.content}
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
