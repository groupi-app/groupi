import {
  View,
  Text,
  Switch,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { useQuery, useMutation } from 'convex/react';

import { BackButton } from '@/components/ui/back-button';
import { useGlobalUser } from '@/context/global-user-context';
import { toast } from '@groupi/shared/platform';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

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

  if (isLoading) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-row items-center px-4 py-3'>
          <BackButton />
          <Text className='text-lg font-semibold text-foreground'>
            Notifications
          </Text>
        </View>
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' />
        </View>
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
        <Text className='mb-3 text-sm font-medium text-muted-foreground'>
          Notification Preferences
        </Text>

        <ToggleRow
          label='Push Notifications'
          description='Receive push notifications on your device'
          value={settings?.pushNotifications ?? true}
          onToggle={val => toggleSetting('pushNotifications', val)}
        />
        <ToggleRow
          label='Email Notifications'
          description='Receive notifications via email'
          value={settings?.emailNotifications ?? true}
          onToggle={val => toggleSetting('emailNotifications', val)}
        />
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
