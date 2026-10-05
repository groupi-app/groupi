import { ApplicationSettings } from '@/components/events/application-settings';
import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { DetailScreenTemplate } from '@/components/templates/detail-screen-template';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import {
  useEventLogistics,
  useUpdateAdmissionPolicy,
} from '@/hooks/use-event-admission';

export default function EventAdmissionSettingsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const id = eventId as Id<'events'>;
  const header = useQuery(api.events.queries.getEventHeader, { eventId: id });
  return (
    <DetailScreenTemplate title='Event admission'>
      {header === undefined ? (
        <Text className='mt-4 text-muted-foreground'>
          Loading admission settings…
        </Text>
      ) : header.userMembership.role !== 'ORGANIZER' ? (
        <Text className='mt-4 text-foreground'>
          Only the event organizer can change admission.
        </Text>
      ) : (
        <AdmissionOptions eventId={id} />
      )}
    </DetailScreenTemplate>
  );
}

function AdmissionOptions({ eventId }: { eventId: Id<'events'> }) {
  const logistics = useEventLogistics(eventId);
  const updateAdmissionPolicy = useUpdateAdmissionPolicy();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function update(
    admissionPolicy: 'INVITATION_ONLY' | 'DIRECT' | 'APPLY'
  ) {
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await updateAdmissionPolicy({ eventId, admissionPolicy });
      setSaved(true);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Could not update admission. Try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (!logistics)
    return (
      <Text className='mt-4 text-muted-foreground'>
        Loading admission settings…
      </Text>
    );
  const current = logistics.event.admissionPolicy;
  return (
    <View className='gap-4 pt-4'>
      <Text className='text-foreground'>
        Choose how eligible viewers become members. Event visibility controls
        who can read logistics and remains separate.
      </Text>
      <Button
        accessibilityLabel='Invitation only'
        accessibilityRole='radio'
        role='radio'
        accessibilityState={{
          checked: current === 'INVITATION_ONLY',
          disabled: saving || current === 'INVITATION_ONLY',
        }}
        variant={current === 'INVITATION_ONLY' ? 'default' : 'outline'}
        disabled={saving || current === 'INVITATION_ONLY'}
        onPress={() => update('INVITATION_ONLY')}
      >
        Invitation only
      </Button>
      <Text className='text-muted-foreground'>
        Viewers need an invitation to join.
      </Text>
      <Button
        accessibilityLabel='Join directly'
        accessibilityRole='radio'
        role='radio'
        accessibilityState={{
          checked: current === 'DIRECT',
          disabled: saving || current === 'DIRECT',
        }}
        variant={current === 'DIRECT' ? 'default' : 'outline'}
        disabled={saving || current === 'DIRECT'}
        onPress={() => update('DIRECT')}
      >
        Join directly
      </Button>
      <Text className='text-muted-foreground'>
        Eligible viewers can join with a Pending RSVP.
      </Text>
      <Button
        accessibilityLabel='Apply for approval'
        accessibilityRole='radio'
        accessibilityState={{ checked: current === 'APPLY' }}
        disabled={saving || current === 'APPLY'}
        onPress={() => update('APPLY')}
      >
        Apply for approval
      </Button>
      <ApplicationSettings eventId={eventId} />
      {saved ? (
        <Text accessibilityLiveRegion='polite' className='text-success'>
          Admission updated.
        </Text>
      ) : null}
      {error ? (
        <Text accessibilityRole='alert' className='text-destructive'>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
