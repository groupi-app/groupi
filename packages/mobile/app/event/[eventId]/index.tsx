import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { View } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

import { usePaginatedEventPosts } from '@/hooks/use-paginated-event-posts';
import { useEventAddons } from '@/hooks/use-addons';
import { canRoleViewAttendeeList } from '@/lib/event-access-policy';
import { canInviteMembers } from '@groupi/shared/utils';

import { EventOwnershipTransfer } from '@/components/events/event-ownership-transfer';
import { EventHeader } from '@/components/events/event-header';
import { MemberList } from '@/components/events/member-list';
import { PostFeed } from '@/components/posts/post-feed';
import { EventDetailSkeleton } from '@/components/events/event-detail-skeleton';
import {
  EventPlanningFeatures,
  EventParticipationFeatures,
} from '@/components/addons/event-features';
import { BackButton } from '@/components/ui/back-button';
import { EmptyState } from '@/components/ui/empty-state';

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
  const {
    results: posts,
    status: postFeedStatus,
    loadMore,
  } = usePaginatedEventPosts(typedEventId);
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
        <EmptyState
          icon='calendar-outline'
          title='Event not found'
          description='This event may have been deleted or you may no longer have access.'
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <PostFeed
        eventId={eventId}
        currentPersonId={headerData.userMembership.person._id}
        userRole={headerData.userMembership.role}
        eventPermissions={headerData.permissions}
        posts={posts}
        status={postFeedStatus}
        loadMore={loadMore}
        header={
          <View>
            <EventHeader
              headerData={headerData}
              permissions={permissions}
              eventId={eventId}
            />

            {addons ? (
              <EventPlanningFeatures addons={addons} eventId={eventId} />
            ) : null}

            {canViewMembers && membersData ? (
              <MemberList
                members={membersData}
                eventId={eventId}
                canManage={permissions?.canManage ?? false}
                canInvite={canInviteMembers(
                  headerData.userMembership.role,
                  headerData.permissions
                )}
              />
            ) : null}

            <View className='gap-2 p-4'>
              <Text
                accessibilityRole='header'
                className='text-lg font-semibold text-foreground'
              >
                Event content
              </Text>
              <View className='flex-row flex-wrap gap-2'>
                {(['forms', 'lists', 'polls'] as const).map(kind => (
                  <Button
                    key={kind}
                    variant='outline'
                    accessibilityLabel={`Event ${kind}`}
                    onPress={() => router.push(`/event/${eventId}/${kind}`)}
                  >
                    {kind === 'forms'
                      ? 'Forms'
                      : kind === 'lists'
                        ? 'Lists'
                        : 'Polls'}
                  </Button>
                ))}
              </View>
            </View>

            <EventOwnershipTransfer
              eventId={typedEventId}
              personId={headerData.userMembership.person._id}
              members={membersData?.event.memberships ?? []}
            />

            {addons && addons.length > 0 ? (
              <EventParticipationFeatures addons={addons} eventId={eventId} />
            ) : null}
          </View>
        }
      />
    </SafeAreaView>
  );
}
