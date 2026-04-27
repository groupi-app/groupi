import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsAddonOptedOut, useToggleAddonOptOut } from '@/hooks/use-addons';

interface ReminderAddonProps {
  eventId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any;
}

const REMINDER_LABELS: Record<string, string> = {
  '30_MINUTES': '30 minutes before',
  '1_HOUR': '1 hour before',
  '2_HOURS': '2 hours before',
  '4_HOURS': '4 hours before',
  '1_DAY': '1 day before',
  '2_DAYS': '2 days before',
  '1_WEEK': '1 week before',
  '2_WEEKS': '2 weeks before',
  '4_WEEKS': '4 weeks before',
};

export function ReminderAddon({ eventId, config }: ReminderAddonProps) {
  const optOutData = useIsAddonOptedOut(eventId, 'reminders');
  const toggleOptOut = useToggleAddonOptOut();

  const isOptedOut = optOutData?.isOptedOut ?? false;
  const timing = config?.reminderTiming ?? '1_HOUR';
  const label = REMINDER_LABELS[timing] ?? timing;

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
          onValueChange={() =>
            toggleOptOut({ eventId, addonType: 'reminders' })
          }
        />
      </View>
    </View>
  );
}
