import { useState } from 'react';
import { View } from 'react-native';
import { type ErrorBoundaryProps, useLocalSearchParams } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { DetailScreenTemplate } from '@/components/templates/detail-screen-template';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useGroup } from '@/hooks/use-groups';
import { useGroupBans, useLiftGroupBan } from '@/hooks/use-group-moderation';
import { GroupPageControls } from '@/components/groups/group-page-controls';
export default function GroupBansScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const id = groupId as Id<'groups'>;
  const group = useGroup(id);
  return (
    <DetailScreenTemplate title='Group bans'>
      {group === undefined ? (
        <Text>Loading Group…</Text>
      ) : group?.canManageMembers ? (
        <GroupBans groupId={id} />
      ) : (
        <Text>Group managers can view and lift bans.</Text>
      )}
    </DetailScreenTemplate>
  );
}
function GroupBans({ groupId }: { groupId: Id<'groups'> }) {
  const [cursor, setCursor] = useState<string | null>(null);
  const bans = useGroupBans(groupId, { numItems: 20, cursor });
  const lift = useLiftGroupBan();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  return (
    <View className='gap-4 pt-4'>
      <Text className='text-muted-foreground'>
        Lifting a ban allows future invitations under the current policy. It
        does not restore membership.
      </Text>
      {bans === undefined ? (
        <Text>Loading bans…</Text>
      ) : bans.page.length === 0 ? (
        <Text>No banned people on this page.</Text>
      ) : (
        bans.page.map(person => (
          <View
            key={person.personId}
            className='gap-2 rounded-card border border-border p-4'
          >
            <Text>{person.name ?? person.username ?? 'Groupi user'}</Text>
            <Button
              variant='outline'
              accessibilityLabel={`Lift ban for ${person.name ?? person.username ?? 'Groupi user'}`}
              disabled={busy !== null}
              accessibilityState={{
                disabled: busy !== null,
                busy: busy === person.personId,
              }}
              isLoading={busy === person.personId}
              onPress={async () => {
                setBusy(person.personId);
                setError('');
                try {
                  await lift({ groupId, personId: person.personId });
                } catch (failure) {
                  setError(
                    failure instanceof Error
                      ? failure.message
                      : 'Could not lift ban. Try again.'
                  );
                } finally {
                  setBusy(null);
                }
              }}
            >
              Lift ban
            </Button>
          </View>
        ))
      )}
      {error ? (
        <Text accessibilityRole='alert' className='text-destructive'>
          {error}
        </Text>
      ) : null}
      <GroupPageControls
        page={bans}
        cursor={cursor}
        onPage={setCursor}
        label='Group bans'
      />
    </View>
  );
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <DetailScreenTemplate title='Group bans'>
      <Text accessibilityRole='alert' className='text-destructive'>
        {error.message ||
          'Group bans are unavailable. Your permissions may have changed.'}
      </Text>
      <Button accessibilityLabel='Retry Group bans' onPress={retry}>
        Try again
      </Button>
    </DetailScreenTemplate>
  );
}
