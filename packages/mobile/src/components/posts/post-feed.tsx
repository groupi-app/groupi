import { useCallback, useMemo, type ReactElement } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  View,
  type ListRenderItem,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

import { LoadingState } from '@/components/molecules';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';
import { POST_FEED_PAGE_SIZE } from '@/hooks/use-paginated-event-posts';
import { PostCard, type PostCardProps } from './post-card';

type PostFeedStatus =
  | 'LoadingFirstPage'
  | 'CanLoadMore'
  | 'LoadingMore'
  | 'Exhausted';

interface PostFeedProps {
  eventId: string;
  header: ReactElement;
  posts: PostCardProps['post'][];
  status: PostFeedStatus;
  loadMore: (count: number) => void;
}

export function shouldLoadMorePosts(status: PostFeedStatus) {
  return status === 'CanLoadMore';
}

export function PostFeed({
  eventId,
  header,
  posts,
  status,
  loadMore,
}: PostFeedProps) {
  const primaryColor = String(useCSSVariable('--color-primary') ?? '');
  const mutedColor = String(useCSSVariable('--color-muted-foreground') ?? '');

  const handleEndReached = useCallback(() => {
    if (shouldLoadMorePosts(status)) {
      loadMore(POST_FEED_PAGE_SIZE);
    }
  }, [loadMore, status]);

  const renderItem = useCallback<ListRenderItem<PostCardProps['post']>>(
    ({ item }) => (
      <View className='px-4'>
        <PostCard post={item} eventId={eventId} />
      </View>
    ),
    [eventId]
  );

  const listHeader = useMemo(
    () => (
      <View>
        {header}
        <View className='mt-6'>
          <SectionHeader
            title='Posts'
            actionLabel='New Post'
            onAction={() => router.push(`/event/${eventId}/new-post`)}
          />
        </View>
      </View>
    ),
    [eventId, header]
  );

  const emptyState =
    status === 'LoadingFirstPage' ? (
      <LoadingState message='Loading posts...' className='min-h-[160px]' />
    ) : (
      <View className='items-center px-6 py-10'>
        <Ionicons name='chatbubble-outline' size={32} color={mutedColor} />
        <Text className='mt-2 text-base text-muted-foreground'>
          No posts yet
        </Text>
        <Text className='mt-1 text-center text-sm text-muted-foreground'>
          Start the conversation with a new post.
        </Text>
      </View>
    );

  const loadingMore =
    status === 'LoadingMore' ? (
      <View
        className='flex-row items-center justify-center gap-2 py-6'
        accessibilityRole='progressbar'
        accessibilityLabel='Loading more posts'
      >
        <ActivityIndicator color={primaryColor} />
        <Text className='text-sm text-muted-foreground'>
          Loading more posts…
        </Text>
      </View>
    ) : null;

  return (
    <FlatList
      className='flex-1'
      contentContainerClassName='gap-3 pb-24'
      data={posts}
      keyExtractor={post => post._id}
      renderItem={renderItem}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={emptyState}
      ListFooterComponent={loadingMore}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      initialNumToRender={POST_FEED_PAGE_SIZE}
      maxToRenderPerBatch={10}
      windowSize={7}
      removeClippedSubviews={Platform.OS === 'android'}
      showsVerticalScrollIndicator={false}
    />
  );
}
