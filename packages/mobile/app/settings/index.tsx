import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { BackButton } from '@/components/ui/back-button';

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  onPress: () => void;
}

function SettingsItem({
  icon,
  label,
  description,
  onPress,
}: SettingsItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className='flex-row items-center gap-3 border-b border-border px-4 py-4'
    >
      <View className='h-10 w-10 items-center justify-center rounded-card bg-muted'>
        <Ionicons name={icon} size={20} color='#6b7280' />
      </View>
      <View className='flex-1'>
        <Text className='text-base font-medium text-foreground'>{label}</Text>
        {description ? (
          <Text className='mt-0.5 text-sm text-muted-foreground'>
            {description}
          </Text>
        ) : null}
      </View>
      <Ionicons name='chevron-forward' size={18} color='#9ca3af' />
    </Pressable>
  );
}

export default function SettingsScreen() {
  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='flex-row items-center px-4 py-3'>
        <BackButton />
        <Text className='text-lg font-semibold text-foreground'>Settings</Text>
      </View>

      <View>
        <SettingsItem
          icon='person-circle-outline'
          label='Account'
          description='Username, emails, linked accounts'
          onPress={() => router.push('/settings/account')}
        />
        <SettingsItem
          icon='color-palette-outline'
          label='Appearance'
          description='Theme and display settings'
          onPress={() => router.push('/settings/appearance')}
        />
        <SettingsItem
          icon='notifications-outline'
          label='Notifications'
          description='Manage notification preferences'
          onPress={() => router.push('/settings/notifications')}
        />
        <SettingsItem
          icon='shield-outline'
          label='Privacy'
          description='Friend requests, invites, blocked users'
          onPress={() => router.push('/settings/privacy')}
        />
        <SettingsItem
          icon='megaphone-outline'
          label="What's New"
          description='Changelog and recent updates'
          onPress={() => router.push('/settings/changelog')}
        />
      </View>
    </SafeAreaView>
  );
}
