import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { DetailScreenTemplate } from '@/components/templates/detail-screen-template';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useGroups } from '@/hooks/use-groups';
import {
  useEventAudiences,
  useShareEventWithGroup,
  useWithdrawGroupEventAudience,
  useSetEventFriendsAudience,
} from '@/hooks/use-group-event-audiences';
import { GroupEventAudienceBoundary } from '@/components/groups/group-event-audience-boundary';
export function EventAudienceSettingsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  return (
    <DetailScreenTemplate title='Event audiences'>
      <GroupEventAudienceBoundary key={eventId}>
        <AudienceSettings eventId={eventId as Id<'events'>} />
      </GroupEventAudienceBoundary>
    </DetailScreenTemplate>
  );
}
function AudienceSettings({ eventId }: { eventId: Id<'events'> }) {
  const audiences = useEventAudiences({ eventId });
  const withdraw = useWithdrawGroupEventAudience();
  const friends = useSetEventFriendsAudience();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setMessage('');
    try {
      await action();
      setMessage(success);
    } catch {
      setMessage(
        'Sharing could not be updated. Your permission or the audience may have changed.'
      );
    } finally {
      setBusy(false);
    }
  }
  if (!audiences)
    return (
      <Text className='text-muted-foreground'>Loading Event audiences…</Text>
    );
  return (
    <View className='gap-4 pt-4'>
      <Text className='text-foreground'>
        Eligible members of any selected whole Group or Friends audience can
        read Event logistics. Public basic details remain public. Sharing does
        not join, invite, or RSVP anyone.
      </Text>
      {audiences.canManageEvent ? (
        <Button
          accessibilityLabel='Share Event with Friends'
          role='checkbox'
          accessibilityRole='checkbox'
          accessibilityState={{
            checked: audiences.friendsShared === true,
            disabled: busy,
          }}
          variant={audiences.friendsShared ? 'default' : 'outline'}
          disabled={busy}
          onPress={() =>
            run(
              () => friends({ eventId, enabled: !audiences.friendsShared }),
              'Friends audience updated.'
            )
          }
        >
          Friends audience
        </Button>
      ) : null}
      <Text
        accessibilityRole='header'
        className='font-semibold text-foreground'
      >
        Shared Groups
      </Text>
      {audiences.groups.length === 0 ? (
        <Text className='text-muted-foreground'>
          No Group audiences selected.
        </Text>
      ) : (
        audiences.groups.map(group => (
          <View
            key={group.groupId}
            className='gap-2 rounded-card border border-border p-3'
          >
            <Text className='text-foreground'>{group.name}</Text>
            {group.canWithdraw ? (
              <Button
                accessibilityLabel={`Withdraw audience ${group.name}`}
                disabled={busy}
                variant='outline'
                onPress={() =>
                  run(
                    () => withdraw({ eventId, groupId: group.groupId }),
                    'Group audience withdrawn. Other audiences and Event participation remain independent.'
                  )
                }
              >
                Withdraw this Group audience
              </Button>
            ) : null}
          </View>
        ))
      )}
      {audiences.canManageEvent ? (
        <GroupSelector
          eventId={eventId}
          selected={audiences.groups.map(g => g.groupId)}
          disabled={busy}
        />
      ) : (
        <Text className='text-muted-foreground'>
          You can withdraw only the Group audiences you manage. Event authority
          remains separate.
        </Text>
      )}
      {message ? (
        <Text accessibilityRole='alert' className='text-foreground'>
          {message}
        </Text>
      ) : null}
    </View>
  );
}
function GroupSelector({
  eventId,
  selected,
  disabled,
}: {
  eventId: Id<'events'>;
  selected: Id<'groups'>[];
  disabled: boolean;
}) {
  const [cursor, setCursor] = useState<string | null>(null);
  const groups = useGroups({ cursor, numItems: 10 });
  const share = useShareEventWithGroup();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  async function add(groupId: Id<'groups'>) {
    setSaving(true);
    setMessage('');
    try {
      await share({ eventId, groupId });
      setMessage('Event shared with the whole Group.');
    } catch {
      setMessage(
        'Sharing unavailable. Check your Event authority, Group permission, and onboarding.'
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <View className='gap-3'>
      <Text
        accessibilityRole='header'
        className='font-semibold text-foreground'
      >
        Choose whole Groups
      </Text>
      {groups === undefined ? (
        <Text className='text-muted-foreground'>Loading your Groups…</Text>
      ) : groups.page.length === 0 ? (
        <Text className='text-muted-foreground'>No Groups on this page.</Text>
      ) : (
        groups.page.map(g => (
          <View
            key={g._id}
            className='gap-2 rounded-card border border-border p-3'
          >
            <Text className='text-foreground'>{g.name}</Text>
            {selected.includes(g._id) ? (
              <Text className='text-muted-foreground'>Already shared</Text>
            ) : g.canShareEvents ? (
              <Button
                accessibilityLabel={`Share Event with ${g.name}`}
                disabled={disabled || saving}
                onPress={() => add(g._id)}
              >
                Share with Group
              </Button>
            ) : (
              <Text className='text-muted-foreground'>
                Sharing unavailable under your current Group permission or
                onboarding.
              </Text>
            )}
          </View>
        ))
      )}
      {groups && !groups.isDone ? (
        <Button
          accessibilityLabel='Next audience Groups page'
          disabled={saving}
          onPress={() => setCursor(groups.continueCursor)}
        >
          Next Groups page
        </Button>
      ) : null}
      {cursor ? (
        <Button
          accessibilityLabel='First audience Groups page'
          disabled={saving}
          onPress={() => setCursor(null)}
        >
          First Groups page
        </Button>
      ) : null}
      {message ? (
        <Text accessibilityRole='alert' className='text-foreground'>
          {message}
        </Text>
      ) : null}
    </View>
  );
}
