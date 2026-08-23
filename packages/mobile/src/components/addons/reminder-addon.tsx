import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsAddonOptedOut, useToggleAddonOptOut } from '@/hooks/use-addons';
import { getReminderOffset, type ReminderOffset } from '@/lib/addon-contracts';

interface ReminderAddonProps {
  eventId: string;
  config: unknown;
}

const REMINDER_LABELS: Record<ReminderOffset, string> = {
  '30_MINUTES': '30 minutes before',
  '1_HOUR': '1 hour before',
  '2_HOURS': '2 hours before',
  '4_HOURS': '4 hours before',
  '1_DAY': '1 day before',
  '2_DAYS': '2 days before',
  '3_DAYS': '3 days before',
  '1_WEEK': '1 week before',
  '2_WEEKS': '2 weeks before',
  '4_WEEKS': '4 weeks before',
};

export function ReminderAddon({ eventId, config }: ReminderAddonProps) {
  const optOutData = useIsAddonOptedOut(eventId, 'reminders');
  const toggleOptOut = useToggleAddonOptOut();
  const [isSaving, setIsSaving] = useState(false);

  const isOptedOut = optOutData?.isOptedOut ?? false;
  const reminderOffset = getReminderOffset(config);
  const label = REMINDER_LABELS[reminderOffset];

  async function handleToggle() {
    setIsSaving(true);
    try {
      await toggleOptOut({ eventId, addonType: 'reminders' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View className='gap-4'>
      <View className='flex-row items-center gap-3'>
        <View className='h-10 w-10 items-center justify-center rounded-card bg-primary/10'>
          <Ionicons name='alarm-outline' size={20} color='#8b00b8' />
        </View>
        <View className='flex-1'>
          <Text className='text-base font-medium text-foreground'>
            Reminder: {label}
          </Text>
          <Text className='text-sm text-muted-foreground'>
            You&apos;ll receive a reminder before the event
          </Text>
        </View>
      </View>

      <View className='flex-row items-center justify-between rounded-card border border-border bg-card px-4 py-3'>
        <View className='flex-1 pr-4'>
          <Text className='text-base font-medium text-foreground'>
            Receive reminder
          </Text>
          <Text className='text-sm text-muted-foreground'>
            {isOptedOut
              ? 'You will not receive reminders for this event'
              : 'You will receive a reminder before the event'}
          </Text>
        </View>
        <Switch
          value={!isOptedOut}
          disabled={optOutData === undefined || isSaving}
          onValueChange={handleToggle}
        />
      </View>
    </View>
  );
}
