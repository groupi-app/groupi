import { View, Switch, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { useQuery, useMutation } from 'convex/react';

import { BackButton } from '@/components/ui/back-button';
import { LoadingState } from '@/components/molecules';
import { useGlobalUser } from '@/context/global-user-context';
import { toast } from '@groupi/shared/platform';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

const NOTIFICATION_CATEGORIES = [
  {
    title: 'Events',
    items: [
      {
        key: 'eventUpdates',
        label: 'Event Updates',
        description: 'When an event you joined is edited',
      },
      {
        key: 'dateChosen',
        label: 'Date Selected',
        description: 'When the organizer picks a date',
      },
      {
        key: 'memberActivity',
        label: 'Member Activity',
        description: 'When someone joins or leaves an event',
      },
      {
        key: 'rsvpUpdates',
        label: 'RSVP Updates',
        description: 'When someone changes their RSVP',
      },
    ],
  },
  {
    title: 'Posts & Replies',
    items: [
      {
        key: 'newPosts',
        label: 'New Posts',
        description: 'When someone creates a post in your event',
      },
      {
        key: 'newReplies',
        label: 'New Replies',
        description: 'When someone replies to your post',
      },
      {
        key: 'mentions',
        label: 'Mentions',
        description: 'When someone mentions you',
      },
    ],
  },
  {
    title: 'Social',
    items: [
      {
        key: 'friendRequests',
        label: 'Friend Requests',
        description: 'When someone sends you a friend request',
      },
      {
        key: 'eventInvites',
        label: 'Event Invites',
        description: 'When someone invites you to an event',
      },
    ],
  },
  {
    title: 'Reminders',
    items: [
      {
        key: 'eventReminders',
        label: 'Event Reminders',
        description: 'Scheduled reminders before events',
      },
    ],
  },
];

export default function NotificationSettingsScreen() {
  const { isAuthenticated } = useGlobalUser();

  const settings = useQuery(
    api.settings.queries.getNotificationSettings,
    isAuthenticated ? {} : 'skip'
  );
  const updateSettings = useMutation(
    api.users.mutations.updateUserNotificationSettings
  );

  const isLoading = settings === undefined;

  async function toggleSetting(key: string, value: boolean) {
    try {
      await updateSettings({ [key]: value });
    } catch {
      toast.error('Failed to update settings');
    }
  }

  function getSettingValue(key: string): boolean {
    if (!settings) return true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (settings as Record<string, any>)[key] ?? true;
  }

  if (isLoading) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-row items-center px-4 py-3'>
          <BackButton />
          <Text className='text-lg font-semibold text-foreground'>
            Notifications
          </Text>
        </View>
        <LoadingState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='flex-row items-center px-4 py-3'>
        <BackButton />
        <Text className='text-lg font-semibold text-foreground'>
          Notifications
        </Text>
      </View>

      <ScrollView className='flex-1 px-4' contentContainerClassName='pb-8 pt-4'>
        {/* Global toggles */}
        <Text className='mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
          Delivery Methods
        </Text>

        <ToggleRow
          label='Push Notifications'
          description='Receive push notifications on your device'
          value={getSettingValue('pushNotifications')}
          onToggle={val => toggleSetting('pushNotifications', val)}
        />
        <ToggleRow
          label='Email Notifications'
          description='Receive notifications via email'
          value={getSettingValue('emailNotifications')}
          onToggle={val => toggleSetting('emailNotifications', val)}
        />

        {/* Per-category settings */}
        {NOTIFICATION_CATEGORIES.map(category => (
          <View key={category.title} className='mt-6'>
            <Text className='mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
              {category.title}
            </Text>
            {category.items.map(item => (
              <ToggleRow
                key={item.key}
                label={item.label}
                description={item.description}
                value={getSettingValue(item.key)}
                onToggle={val => toggleSetting(item.key, val)}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onToggle,
}: {
  label: string;
  description: string;
  value: boolean;
  onToggle: (val: boolean) => void;
}) {
  return (
    <View className='flex-row items-center justify-between border-b border-border py-4'>
      <View className='flex-1 pr-4'>
        <Text className='text-base font-medium text-foreground'>{label}</Text>
        <Text className='mt-0.5 text-sm text-muted-foreground'>
          {description}
        </Text>
      </View>
      <Switch value={value} onValueChange={onToggle} />
    </View>
  );
}
