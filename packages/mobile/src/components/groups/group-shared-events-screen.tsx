import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { DetailScreenTemplate } from '@/components/templates/detail-screen-template';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import {
  useGroupSharedEvents,
  useWithdrawGroupEventAudience,
} from '@/hooks/use-group-event-audiences';
import { GroupEventAudienceBoundary } from './group-event-audience-boundary';
export function GroupSharedEventsScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  return (
    <DetailScreenTemplate title='Group shared Events'>
      <GroupEventAudienceBoundary key={groupId}>
        <SharedEvents groupId={groupId as Id<'groups'>} />
      </GroupEventAudienceBoundary>
    </DetailScreenTemplate>
  );
}
function SharedEvents({ groupId }: { groupId: Id<'groups'> }) {
  const [cursor, setCursor] = useState<string | null>(null);
  const events = useGroupSharedEvents({
    groupId,
    paginationOpts: { cursor, numItems: 10 },
  });
  const withdraw = useWithdrawGroupEventAudience();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function remove(eventId: Id<'events'>) {
    setBusy(true);
    setMessage('');
    try {
      await withdraw({ groupId, eventId });
      setMessage(
        'This Group audience was withdrawn. Other audiences and existing Event membership remain independent.'
      );
    } catch {
      setMessage(
        'Withdrawal unavailable. Your authority or the Group audience may have changed.'
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <View className='gap-4 pt-4'>
      <Text className='text-muted-foreground'>
        Upcoming and undated Events shared with this Group. Read logistics
        without joining or changing your RSVP.
      </Text>
      {events === undefined ? (
        <Text className='text-muted-foreground'>Loading shared Events…</Text>
      ) : events.page.length === 0 ? (
        <Text className='text-muted-foreground'>
          No shared Events on this page.
        </Text>
      ) : (
        events.page.map(({ event, canWithdraw }) => (
          <View
            key={event._id}
            className='gap-2 rounded-card border border-border bg-card p-4'
          >
            <Text
              accessibilityRole='header'
              className='font-semibold text-foreground'
            >
              {event.title}
            </Text>
            {event.description ? (
              <Text className='text-foreground'>{event.description}</Text>
            ) : null}
            {event.location ? (
              <Text className='text-foreground'>{event.location}</Text>
            ) : null}
            <Text className='text-muted-foreground'>
              {event.chosenDateTime === null
                ? 'Date not yet chosen'
                : new Date(event.chosenDateTime).toLocaleString(undefined, {
                    timeZone: event.timezone,
                  })}
            </Text>
            <Text className='text-muted-foreground'>
              Times shown in {event.timezone}
            </Text>
            <Button
              accessibilityLabel={`View logistics for ${event.title}`}
              variant='outline'
              onPress={() => router.push(`/event/${event._id}/preview`)}
            >
              View Event logistics
            </Button>
            {canWithdraw ? (
              <Button
                accessibilityLabel={`Withdraw Group audience for ${event.title}`}
                variant='outline'
                disabled={busy}
                onPress={() => remove(event._id)}
              >
                Withdraw this Group audience
              </Button>
            ) : null}
          </View>
        ))
      )}
      {events && !events.isDone ? (
        <Button
          accessibilityLabel='Next Group shared Events page'
          disabled={busy}
          onPress={() => setCursor(events.continueCursor)}
        >
          Next Events page
        </Button>
      ) : null}
      {cursor ? (
        <Button
          accessibilityLabel='First Group shared Events page'
          disabled={busy}
          onPress={() => setCursor(null)}
        >
          First Events page
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
