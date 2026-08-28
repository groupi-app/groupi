import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { toast } from '@groupi/shared/platform';

import { SingleDateStep } from '@/components/create-event/single-date-step';
import { LoadingState } from '@/components/molecules';
import { DetailScreenTemplate } from '@/components/templates';
import { EmptyState } from '@/components/ui/empty-state';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  CreateEventProvider,
  useCreateEventForm,
} from '@/context/create-event-context';
import { useEventHeader } from '@/hooks/use-events';
import { useChooseEventDate } from '@/hooks/use-members';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';

function SingleDateForm({
  eventId,
  initialStart,
  initialEnd,
}: {
  eventId: Id<'events'>;
  initialStart: Date;
  initialEnd?: Date;
}) {
  const { formState } = useCreateEventForm();
  const chooseDate = useChooseEventDate();
  const [isSaving, setIsSaving] = useState(false);
  const isDirty =
    formState.singleDate.getTime() !== initialStart.getTime() ||
    (formState.singleEndDate?.getTime() ?? null) !==
      (initialEnd?.getTime() ?? null);
  const allowNextNavigation = useUnsavedChanges(isDirty);

  function handleSave() {
    showConfirmDialog({
      title: 'Update date and time?',
      message: 'This will replace the current date or attendee poll.',
      confirmLabel: 'Update Date',
      onConfirm: async () => {
        setIsSaving(true);
        try {
          await chooseDate({
            eventId,
            chosenDateTime: formState.singleDate.getTime(),
            chosenEndDateTime: formState.hasEndTime
              ? formState.singleEndDate?.getTime()
              : undefined,
            selectionSource: 'MANUAL',
          });
          allowNextNavigation();
          router.replace(`/event/${eventId}`);
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : 'Failed to update date and time'
          );
        } finally {
          setIsSaving(false);
        }
      },
    });
  }

  return (
    <SingleDateStep
      onBack={() => router.back()}
      onNext={handleSave}
      submitLabel='Save date'
      isSubmitting={isSaving}
    />
  );
}

export default function EventSingleDateSettingsScreen() {
  const { eventId: eventIdParam } = useLocalSearchParams<{ eventId: string }>();
  const eventId = eventIdParam as Id<'events'>;
  const headerData = useEventHeader(eventId);
  const [defaultStart] = useState(
    () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );

  if (headerData === undefined) {
    return (
      <DetailScreenTemplate title='Choose a Date' scrollable={false}>
        <LoadingState />
      </DetailScreenTemplate>
    );
  }

  if (!headerData || headerData.userMembership.role !== 'ORGANIZER') {
    return (
      <DetailScreenTemplate title='Choose a Date'>
        <EmptyState
          icon='lock-closed-outline'
          title='Date settings unavailable'
          description='Only the event organizer can change the date.'
        />
      </DetailScreenTemplate>
    );
  }

  const initialStart = headerData.event.chosenDateTime
    ? new Date(headerData.event.chosenDateTime)
    : defaultStart;
  const initialEnd = headerData.event.chosenEndDateTime
    ? new Date(headerData.event.chosenEndDateTime)
    : undefined;

  return (
    <DetailScreenTemplate title='Choose a Date' scrollable={false}>
      <CreateEventProvider
        initialState={{
          singleDate: initialStart,
          singleEndDate: initialEnd,
          hasEndTime: Boolean(initialEnd),
        }}
      >
        <SingleDateForm
          eventId={eventId}
          initialStart={initialStart}
          initialEnd={initialEnd}
        />
      </CreateEventProvider>
    </DetailScreenTemplate>
  );
}
