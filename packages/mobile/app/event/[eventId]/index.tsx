import { ScrollView, RefreshControl, View } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { useLocalSearchParams } from 'expo-router';
import { useState, useCallback } from 'react';

import {
  useEventHeader,
  useEventMembers,
  useCanManageEvent,
} from '@/hooks/use-events';
import { useEventPostFeed } from '@/hooks/use-posts';
import { useEventAddons } from '@/hooks/use-addons';

import { EventHeader } from '@/components/events/event-header';
import { MemberList } from '@/components/events/member-list';
import { PostFeed } from '@/components/posts/post-feed';
import { EventDetailSkeleton } from '@/components/events/event-detail-skeleton';
import { EventAddonsSection } from '@/components/addons/event-addons-section';
import { LoadingState } from '@/components/molecules';
import { BackButton } from '@/components/ui/back-button';

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [refreshing, setRefreshing] = useState(false);

  const headerData = useEventHeader(eventId as never);
  const membersData = useEventMembers(eventId as never);
  const postFeedData = useEventPostFeed(eventId as never);
  const permissions = useCanManageEvent(eventId as never);
  const addons = useEventAddons(eventId);

  const isLoading = headerData === undefined;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-row items-center px-4 py-3'>
          <BackButton />
        </View>
        <EventDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (!headerData) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-row items-center px-4 py-3'>
          <BackButton />
        </View>
        <LoadingState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <ScrollView
        className='flex-1'
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerClassName='pb-24'
      >
        <EventHeader
          headerData={headerData}
          permissions={permissions}
          eventId={eventId}
        />

        {membersData ? (
          <MemberList
            members={membersData}
            eventId={eventId}
            canManage={permissions?.canManage ?? false}
          />
        ) : null}

        {addons && addons.length > 0 ? (
          <EventAddonsSection addons={addons} eventId={eventId} />
        ) : null}

        <PostFeed postFeedData={postFeedData} eventId={eventId} />
      </ScrollView>
    </SafeAreaView>
  );
}
