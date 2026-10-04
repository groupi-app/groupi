import { Component, useState, type ReactNode } from 'react';
import { Image, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { DetailScreenTemplate } from '@/components/templates/detail-screen-template';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useEventLogistics, useJoinEvent } from '@/hooks/use-event-admission';

class LogisticsBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <DetailScreenTemplate title='Event preview'>
          <Text accessibilityRole='alert' className='mt-4 text-foreground'>
            Event unavailable. You may not have access to this event.
          </Text>
        </DetailScreenTemplate>
      );
    return this.props.children;
  }
}

export default function EventPreviewScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  return (
    <LogisticsBoundary key={eventId}>
      <EventLogistics eventId={eventId as Id<'events'>} />
    </LogisticsBoundary>
  );
}

function EventLogistics({ eventId }: { eventId: Id<'events'> }) {
  const logistics = useEventLogistics(eventId);
  const joinEvent = useJoinEvent();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  async function join() {
    setJoining(true);
    setError('');
    try {
      await joinEvent({ eventId });
      router.replace(`/event/${eventId}`);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Could not join event. Try again.'
      );
    } finally {
      setJoining(false);
    }
  }

  if (!logistics)
    return (
      <DetailScreenTemplate title='Event preview'>
        <Text className='mt-4 text-muted-foreground'>Loading event…</Text>
      </DetailScreenTemplate>
    );
  const { event, organizer, entryAction } = logistics;
  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleString(undefined, {
      timeZone: event.timezone,
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  return (
    <DetailScreenTemplate title='Event preview'>
      <View className='gap-4 pt-4'>
        <Text
          accessibilityRole='header'
          className='text-2xl font-bold text-foreground'
        >
          {event.title}
        </Text>
        {event.imageUrl ? (
          <Image
            source={{ uri: event.imageUrl }}
            accessibilityLabel={`${event.title} cover image`}
            className='h-48 w-full rounded-card'
          />
        ) : null}
        {event.description ? (
          <Text className='text-foreground'>{event.description}</Text>
        ) : null}
        {organizer ? (
          <Text className='text-muted-foreground'>
            Organizer:{' '}
            {organizer.name ?? organizer.username ?? 'Event organizer'}
          </Text>
        ) : null}
        {event.location ? (
          <Text className='text-foreground'>{event.location}</Text>
        ) : null}
        <Text className='text-muted-foreground'>
          Times shown in {event.timezone}
        </Text>
        {event.chosenDateTime !== null ? (
          <Text className='text-foreground'>
            {formatDate(event.chosenDateTime)}
            {event.chosenEndDateTime !== null
              ? ` – ${formatDate(event.chosenEndDateTime)}`
              : ''}
          </Text>
        ) : (
          <>
            <Text className='text-muted-foreground'>Date not yet chosen</Text>
            {event.potentialDateTimeOptions.map(option => (
              <View
                key={option.id}
                className='gap-1 rounded-card border border-border p-3'
              >
                <Text className='text-foreground'>
                  {formatDate(option.start)}
                  {option.end !== null ? ` – ${formatDate(option.end)}` : ''}
                </Text>
                {option.note ? (
                  <Text className='text-muted-foreground'>{option.note}</Text>
                ) : null}
              </View>
            ))}
          </>
        )}
        <Text className='text-muted-foreground'>
          Admission:{' '}
          {event.admissionPolicy === 'DIRECT'
            ? 'Join directly'
            : event.admissionPolicy === 'APPLY'
              ? 'Apply for approval'
              : 'Invitation only'}
        </Text>
        {entryAction === 'JOIN' ? (
          <>
            <Text className='text-muted-foreground'>
              Joining adds you as a member with a Pending RSVP. Choose your RSVP
              after joining.
            </Text>
            <Button
              accessibilityLabel={`Join ${event.title}`}
              onPress={join}
              disabled={joining}
              isLoading={joining}
              loadingText='Joining…'
            >
              Join Event
            </Button>
          </>
        ) : entryAction === 'APPLY' ? (
          <Button
            accessibilityLabel={`Apply to ${event.title}`}
            onPress={() => router.push(`/event/${eventId}/application`)}
          >
            Apply for approval
          </Button>
        ) : entryAction === 'SIGN_IN' ? (
          <Button
            accessibilityLabel={`Sign in to view entry options for ${event.title}`}
            onPress={() =>
              router.push({
                pathname: '/(auth)/sign-in',
                params: { returnTo: `/event/${eventId}/preview` },
              })
            }
          >
            Sign in or sign up
          </Button>
        ) : entryAction === 'MEMBER' ? (
          <Button
            accessibilityLabel={`Open ${event.title}`}
            onPress={() => router.push(`/event/${eventId}`)}
          >
            Open Event
          </Button>
        ) : entryAction === 'INVITATION_ONLY' ? (
          <Text className='text-muted-foreground'>
            An invitation is required to join this event.
          </Text>
        ) : (
          <Text className='text-muted-foreground'>
            Joining is unavailable for this event.
          </Text>
        )}
        <Button
          variant='outline'
          accessibilityLabel='My application history'
          onPress={() => router.push(`/event/${eventId}/application`)}
        >
          My application history
        </Button>
        {error ? (
          <Text accessibilityRole='alert' className='text-destructive'>
            {error}
          </Text>
        ) : null}
      </View>
    </DetailScreenTemplate>
  );
}
