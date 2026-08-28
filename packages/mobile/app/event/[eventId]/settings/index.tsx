import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

import { LoadingState } from '@/components/molecules';
import { DetailScreenTemplate } from '@/components/templates';
import { EmptyState } from '@/components/ui/empty-state';
import { Text } from '@/components/ui/text';
import { useEventHeader } from '@/hooks/use-events';

const SETTINGS = [
  {
    key: 'details',
    label: 'Details',
    description: 'Title, description, location, visibility, and cover image',
    icon: 'create-outline',
  },
  {
    key: 'date',
    label: 'Date & Time',
    description: 'Choose a date or start a new attendee poll',
    icon: 'calendar-outline',
    organizerOnly: true,
  },
  {
    key: 'addons',
    label: 'Add-ons',
    description: 'Configure event tools and automations',
    icon: 'extension-puzzle-outline',
  },
  {
    key: 'permissions',
    label: 'Permissions',
    description: 'Control what event members can do',
    icon: 'shield-checkmark-outline',
    organizerOnly: true,
  },
] as const;

export default function EventSettingsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const headerData = useEventHeader(eventId as never);
  const iconColor = String(
    useCSSVariable('--color-muted-foreground') ?? 'transparent'
  );

  if (headerData === undefined) {
    return (
      <DetailScreenTemplate title='Event Settings'>
        <LoadingState />
      </DetailScreenTemplate>
    );
  }

  const role = headerData?.userMembership?.role;
  if (!headerData || (role !== 'ORGANIZER' && role !== 'MODERATOR')) {
    return (
      <DetailScreenTemplate title='Event Settings'>
        <EmptyState
          icon='lock-closed-outline'
          title='Settings unavailable'
          description="You don't have permission to manage this event."
        />
      </DetailScreenTemplate>
    );
  }

  const isOrganizer = role === 'ORGANIZER';

  return (
    <DetailScreenTemplate title='Event Settings'>
      <View className='overflow-hidden rounded-card border border-border bg-card'>
        {SETTINGS.map((item, index) => {
          const disabled = Boolean(
            'organizerOnly' in item && item.organizerOnly && !isOrganizer
          );
          const destination =
            item.key === 'details'
              ? `/event/${eventId}/edit`
              : item.key === 'addons'
                ? `/event/${eventId}/addons/manage`
                : `/event/${eventId}/settings/${item.key}`;

          return (
            <Pressable
              key={item.key}
              onPress={() => router.push(destination)}
              disabled={disabled}
              accessibilityRole='button'
              accessibilityLabel={item.label}
              accessibilityHint={
                disabled
                  ? 'Only the organizer can change this setting'
                  : item.description
              }
              accessibilityState={{ disabled }}
              className={`flex-row items-center gap-3 px-4 py-4 ${
                index < SETTINGS.length - 1 ? 'border-b border-border' : ''
              } ${disabled ? 'opacity-50' : ''}`}
            >
              <View className='h-10 w-10 items-center justify-center rounded-card bg-muted'>
                <Ionicons name={item.icon} size={20} color={iconColor} />
              </View>
              <View className='flex-1'>
                <Text className='text-base font-semibold text-foreground'>
                  {item.label}
                </Text>
                <Text className='mt-0.5 text-sm text-muted-foreground'>
                  {disabled ? 'Organizer only' : item.description}
                </Text>
              </View>
              {!disabled ? (
                <Ionicons name='chevron-forward' size={18} color={iconColor} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </DetailScreenTemplate>
  );
}
