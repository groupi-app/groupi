import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { SectionHeader } from '@/components/ui/section-header';
import { PostCard } from './post-card';
import { LoadingState } from '@/components/molecules';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PostFeedData = any;

interface PostFeedProps {
  postFeedData: PostFeedData;
  eventId: string;
}

export function PostFeed({ postFeedData, eventId }: PostFeedProps) {
  if (postFeedData === undefined) {
    return (
      <LoadingState message='Loading posts...' className='min-h-[160px]' />
    );
  }

  // The query returns { event: { posts: [...] }, ... }
  const posts = postFeedData?.event?.posts ?? postFeedData?.posts ?? [];

  return (
    <View className='mt-6'>
      <SectionHeader title='Posts' count={posts.length} />

      {posts.length === 0 ? (
        <View className='items-center px-6 py-8'>
          <Ionicons name='chatbubble-outline' size={32} color='#9ca3af' />
          <Text className='mt-2 text-base text-muted-foreground'>
            No posts yet
          </Text>
          <Pressable
            onPress={() => router.push(`/event/${eventId}/new-post`)}
            className='mt-3'
          >
            <Text className='text-base font-medium text-primary'>
              Create the first post
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className='gap-3 px-4'>
          {posts.map(
            (post: {
              _id: string;
              title: string;
              content: string;
              _creationTime: number;
              updatedAt?: number;
              author?: {
                person?: {
                  _id: string;
                  user?: { name: string; image?: string };
                };
                user?: { name: string; image?: string };
              } | null;
              replyCount?: number;
            }) => (
              <PostCard key={post._id} post={post} eventId={eventId} />
            )
          )}
        </View>
      )}

      {/* FAB for new post */}
      <View className='mt-4 items-center'>
        <Pressable
          onPress={() => router.push(`/event/${eventId}/new-post`)}
          className='flex-row items-center gap-2 rounded-button bg-primary px-5 py-3'
        >
          <Ionicons name='add' size={20} color='#ffffff' />
          <Text className='text-base font-semibold text-primary-foreground'>
            New Post
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
