import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { toast } from '@groupi/shared/platform';

import { MultiDateStep } from '@/components/create-event/multi-date-step';
import { LoadingState } from '@/components/molecules';
import { DetailScreenTemplate } from '@/components/templates';
import { EmptyState } from '@/components/ui/empty-state';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  CreateEventProvider,
  useCreateEventForm,
  type DateOption,
} from '@/context/create-event-context';
import { useEventAvailabilityData } from '@/hooks/use-availability';
import { useEventHeader } from '@/hooks/use-events';
import {
  useResetEventDate,
  useUpdatePotentialDateTimes,
} from '@/hooks/use-members';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';

function serializeOptions(options: DateOption[]) {
  return options.map(option => ({
    start: option.date.getTime(),
    end: option.endDate?.getTime(),
    note: option.note?.trim() || undefined,
  }));
}

function MultiDateForm({
  eventId,
  initialOptions,
}: {
  eventId: Id<'events'>;
  initialOptions: DateOption[];
}) {
  const { formState } = useCreateEventForm();
  const updatePotentialDates = useUpdatePotentialDateTimes();
  const resetDate = useResetEventDate();
  const [isSaving, setIsSaving] = useState(false);
  const serializedOptions = serializeOptions(formState.dateOptions);
  const isDirty =
    JSON.stringify(serializedOptions) !==
    JSON.stringify(serializeOptions(initialOptions));
  const allowNextNavigation = useUnsavedChanges(isDirty);

  function handleSave() {
    showConfirmDialog({
      title: 'Start a new date poll?',
      message:
        'This will replace the current date options and clear the confirmed date.',
      confirmLabel: 'Start Poll',
      onConfirm: async () => {
        setIsSaving(true);
        try {
          await updatePotentialDates({
            eventId,
            potentialDateTimeOptions: serializedOptions,
          });
          await resetDate(eventId, { silent: true });
          toast.success('New date poll started');
          allowNextNavigation();
          router.replace(`/event/${eventId}/availability`);
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : 'Failed to start a new date poll'
          );
        } finally {
          setIsSaving(false);
        }
      },
    });
  }

  return (
    <MultiDateStep
      onBack={() => router.back()}
      onNext={handleSave}
      submitLabel='Start poll'
      isSubmitting={isSaving}
    />
  );
}

export default function EventMultiDateSettingsScreen() {
  const { eventId: eventIdParam } = useLocalSearchParams<{ eventId: string }>();
  const eventId = eventIdParam as Id<'events'>;
  const headerData = useEventHeader(eventId);
  const availabilityData = useEventAvailabilityData(eventId);

  if (headerData === undefined || availabilityData === undefined) {
    return (
      <DetailScreenTemplate title='Poll Attendees' scrollable={false}>
        <LoadingState />
      </DetailScreenTemplate>
    );
  }

  if (!headerData || headerData.userMembership.role !== 'ORGANIZER') {
    return (
      <DetailScreenTemplate title='Poll Attendees'>
        <EmptyState
          icon='lock-closed-outline'
          title='Date settings unavailable'
          description='Only the event organizer can start a date poll.'
        />
      </DetailScreenTemplate>
    );
  }

  const initialOptions = availabilityData.potentialDateTimes.map(option => ({
    id: option._id,
    date: new Date(option.dateTime),
    endDate: option.endDateTime ? new Date(option.endDateTime) : undefined,
    note: option.note ?? undefined,
  }));

  return (
    <DetailScreenTemplate title='Poll Attendees' scrollable={false}>
      <CreateEventProvider initialState={{ dateOptions: initialOptions }}>
        <MultiDateForm eventId={eventId} initialOptions={initialOptions} />
      </CreateEventProvider>
    </DetailScreenTemplate>
  );
}
