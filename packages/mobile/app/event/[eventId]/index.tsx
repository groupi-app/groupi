import { ScrollView, View } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

import { useEventPostFeed } from '@/hooks/use-posts';
import { useEventAddons } from '@/hooks/use-addons';
import { canRoleViewAttendeeList } from '@/lib/event-access-policy';

import { EventHeader } from '@/components/events/event-header';
import { MemberList } from '@/components/events/member-list';
import { PostFeed } from '@/components/posts/post-feed';
import { EventDetailSkeleton } from '@/components/events/event-detail-skeleton';
import { EventAddonsSection } from '@/components/addons/event-addons-section';
import { LoadingState } from '@/components/molecules';
import { BackButton } from '@/components/ui/back-button';

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const typedEventId = eventId as Id<'events'>;

  const headerData = useQuery(api.events.queries.getEventHeader, {
    eventId: typedEventId,
  });
  const canViewMembers = canRoleViewAttendeeList(
    headerData?.userMembership.role,
    headerData?.permissions.viewAttendeeList
  );
  const membersData = useQuery(
    api.events.queries.getEventAttendeesData,
    canViewMembers ? { eventId: typedEventId } : 'skip'
  );
  const postFeedData = useEventPostFeed(typedEventId);
  const addons = useEventAddons(eventId);
  const role = headerData?.userMembership.role;
  const permissions = {
    canManage: role === 'ORGANIZER' || role === 'MODERATOR',
    canDelete: role === 'ORGANIZER',
    canEdit: role === 'ORGANIZER' || role === 'MODERATOR',
    role,
  };

  const isLoading = headerData === undefined;

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
      <ScrollView className='flex-1' contentContainerClassName='pb-24'>
        <EventHeader
          headerData={headerData}
          permissions={permissions}
          eventId={eventId}
        />

        {canViewMembers && membersData ? (
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
