import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation } from 'convex/react';
import type { Id } from 'convex/_generated/dataModel';
import { api } from 'convex/_generated/api';
import { toast } from '@groupi/shared/platform';

import { PermissionsStep } from '@/components/create-event/permissions-step';
import { LoadingState } from '@/components/molecules';
import { DetailScreenTemplate } from '@/components/templates';
import { EmptyState } from '@/components/ui/empty-state';
import {
  CreateEventProvider,
  useCreateEventForm,
  type EventPermissions,
} from '@/context/create-event-context';
import { useEventHeader } from '@/hooks/use-events';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';

function PermissionsForm({
  eventId,
  initialPermissions,
}: {
  eventId: Id<'events'>;
  initialPermissions: EventPermissions;
}) {
  const { formState } = useCreateEventForm();
  const updatePermissions = useMutation(
    api.events.mutations.updateEventPermissions
  );
  const [isSaving, setIsSaving] = useState(false);
  const permissions = formState.permissions ?? initialPermissions;
  const isDirty =
    permissions.createPosts !== initialPermissions.createPosts ||
    permissions.inviteMembers !== initialPermissions.inviteMembers ||
    permissions.viewAttendeeList !== initialPermissions.viewAttendeeList;
  const allowNextNavigation = useUnsavedChanges(isDirty);

  async function handleSave() {
    setIsSaving(true);
    try {
      await updatePermissions({ eventId, ...permissions });
      toast.success('Permissions updated');
      allowNextNavigation();
      router.back();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update permissions'
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PermissionsStep
      onBack={() => router.back()}
      onNext={handleSave}
      submitLabel='Save changes'
      isSubmitting={isSaving}
    />
  );
}

export default function EventPermissionsSettingsScreen() {
  const { eventId: eventIdParam } = useLocalSearchParams<{ eventId: string }>();
  const eventId = eventIdParam as Id<'events'>;
  const headerData = useEventHeader(eventId);

  if (headerData === undefined) {
    return (
      <DetailScreenTemplate title='Permissions' scrollable={false}>
        <LoadingState />
      </DetailScreenTemplate>
    );
  }

  if (!headerData || headerData.userMembership.role !== 'ORGANIZER') {
    return (
      <DetailScreenTemplate title='Permissions'>
        <EmptyState
          icon='lock-closed-outline'
          title='Permissions unavailable'
          description='Only the event organizer can change permissions.'
        />
      </DetailScreenTemplate>
    );
  }

  return (
    <DetailScreenTemplate title='Permissions' scrollable={false}>
      <CreateEventProvider
        initialState={{ permissions: headerData.permissions }}
      >
        <PermissionsForm
          eventId={eventId}
          initialPermissions={headerData.permissions}
        />
      </CreateEventProvider>
    </DetailScreenTemplate>
  );
}
