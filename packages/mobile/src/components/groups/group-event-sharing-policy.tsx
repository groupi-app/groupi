import { useState } from 'react';
import { View } from 'react-native';
import type { Id } from 'convex/_generated/dataModel';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useConfigureGroupEventSharing } from '@/hooks/use-group-event-audiences';
export function GroupEventSharingPolicy({
  groupId,
  policy,
}: {
  groupId: Id<'groups'>;
  policy: 'MANAGERS' | 'MEMBERS';
}) {
  const configure = useConfigureGroupEventSharing();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function save(value: 'MANAGERS' | 'MEMBERS') {
    setBusy(true);
    setMessage('');
    try {
      await configure({ groupId, policy: value });
      setMessage('Group Event sharing policy updated.');
    } catch {
      setMessage(
        'Could not update sharing policy. Only the current owner can change it.'
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <View className='gap-3 rounded-card border border-border p-3'>
      <Text
        accessibilityRole='header'
        className='font-semibold text-foreground'
      >
        Who can share Events with this Group?
      </Text>
      <Text className='text-muted-foreground'>
        Sharing also requires Event Organizer authority and current Group
        eligibility.
      </Text>
      {(['MANAGERS', 'MEMBERS'] as const).map(value => (
        <Button
          key={value}
          accessibilityLabel={
            value === 'MANAGERS'
              ? 'Group managers share Events'
              : 'Eligible Group members share Events'
          }
          accessibilityRole='radio'
          role='radio'
          accessibilityState={{
            checked: policy === value,
            disabled: busy || policy === value,
          }}
          variant={policy === value ? 'default' : 'outline'}
          disabled={busy || policy === value}
          onPress={() => save(value)}
        >
          {value === 'MANAGERS' ? 'Managers only' : 'Eligible members'}
        </Button>
      ))}
      {message ? (
        <Text accessibilityRole='alert' className='text-foreground'>
          {message}
        </Text>
      ) : null}
    </View>
  );
}
