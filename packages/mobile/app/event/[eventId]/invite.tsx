import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

import { EmailInvitePanel } from '@/components/invites/email-invite-panel';
import { InviteSkeleton } from '@/components/invites/invite-skeleton';
import { LinkInvitePanel } from '@/components/invites/link-invite-panel';
import { PeopleInvitePanel } from '@/components/invites/people-invite-panel';
import { isPresent } from '@/components/invites/invite-types';
import { TabBarFilter } from '@/components/molecules/tab-bar-filter';
import { BackButton } from '@/components/ui/back-button';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { useFriendsList } from '@/hooks/use-friends';
import { useSentEventInvites } from '@/hooks/use-event-invites';
import { useEventMembers } from '@/hooks/use-events';

type InviteTab = 'link' | 'people' | 'email';

export default function InviteScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const typedEventId = eventId as Id<'events'>;
  const [activeTab, setActiveTab] = useState<InviteTab>('link');

  const inviteData = useQuery(api.invites.queries.getEventInvites, {
    eventId: typedEventId,
  });
  const eventHeader = useQuery(api.events.queries.getEventHeader, {
    eventId: typedEventId,
  });
  const sentInvites = useSentEventInvites(typedEventId);
  const friends = useFriendsList();
  const eventMembers = useEventMembers(typedEventId);
  const availableSentInvites = sentInvites?.filter(isPresent);
  const availableFriends = friends?.filter(isPresent);

  const pendingPeopleCount =
    availableSentInvites?.filter(invite => invite.status === 'PENDING')
      .length ?? 0;
  const pendingEmailCount = inviteData?.pendingEmailCount ?? 0;
  const linkCount =
    inviteData?.invites.filter(invite => !invite.hasEmail).length ?? 0;

  if (inviteData === undefined || eventHeader === undefined) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <ScreenHeader />
        <View
          accessible
          accessibilityLabel='Loading invite options'
          accessibilityRole='progressbar'
        >
          <InviteSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  const canInviteModerator = eventHeader.userMembership.role === 'ORGANIZER';

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <ScreenHeader />
      <View className='px-4 pb-2'>
        <Text className='text-sm text-muted-foreground'>
          Choose how people join {eventHeader.event.title}.
        </Text>
      </View>
      <TabBarFilter
        activeTab={activeTab}
        onTabChange={key => setActiveTab(key as InviteTab)}
        tabs={[
          { key: 'link', label: 'Link', badge: linkCount },
          { key: 'people', label: 'People', badge: pendingPeopleCount },
          { key: 'email', label: 'Email', badge: pendingEmailCount },
        ]}
      />

      {activeTab === 'link' ? (
        <LinkInvitePanel eventId={typedEventId} inviteData={inviteData} />
      ) : activeTab === 'people' ? (
        <PeopleInvitePanel
          eventId={typedEventId}
          canInviteModerator={canInviteModerator}
          sentInvites={availableSentInvites}
          friends={availableFriends}
          eventMembers={eventMembers}
        />
      ) : (
        <EmailInvitePanel eventId={typedEventId} inviteData={inviteData} />
      )}
    </SafeAreaView>
  );
}

function ScreenHeader() {
  return (
    <View className='flex-row items-center px-4 py-3'>
      <BackButton />
      <Text className='text-lg font-semibold text-foreground'>
        Invite People
      </Text>
    </View>
  );
}
