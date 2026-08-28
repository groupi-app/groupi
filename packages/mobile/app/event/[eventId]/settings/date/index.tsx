import { router, useLocalSearchParams } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';

import { DateTypeStep } from '@/components/create-event/date-type-step';
import { LoadingState } from '@/components/molecules';
import { DetailScreenTemplate } from '@/components/templates';
import { EmptyState } from '@/components/ui/empty-state';
import { useEventHeader } from '@/hooks/use-events';

export default function EventDateSettingsScreen() {
  const { eventId: eventIdParam } = useLocalSearchParams<{ eventId: string }>();
  const eventId = eventIdParam as Id<'events'>;
  const headerData = useEventHeader(eventId);

  if (headerData === undefined) {
    return (
      <DetailScreenTemplate title='Date & Time' scrollable={false}>
        <LoadingState />
      </DetailScreenTemplate>
    );
  }

  if (!headerData || headerData.userMembership.role !== 'ORGANIZER') {
    return (
      <DetailScreenTemplate title='Date & Time'>
        <EmptyState
          icon='lock-closed-outline'
          title='Date settings unavailable'
          description='Only the event organizer can change the date or start a poll.'
        />
      </DetailScreenTemplate>
    );
  }

  return (
    <DetailScreenTemplate title='Date & Time' scrollable={false}>
      <DateTypeStep
        onSelectSingle={() =>
          router.push(`/event/${eventIdParam}/settings/date/single`)
        }
        onSelectMulti={() =>
          router.push(`/event/${eventIdParam}/settings/date/multi`)
        }
        onBack={() => router.back()}
      />
    </DetailScreenTemplate>
  );
}
