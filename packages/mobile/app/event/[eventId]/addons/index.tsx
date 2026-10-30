import { useLocalSearchParams } from 'expo-router';
import { DetailScreenTemplate } from '@/components/templates';
import { LoadingState } from '@/components/molecules';
import { useEventAddons } from '@/hooks/use-addons';
import {
  EventPlanningFeatures,
  EventParticipationFeatures,
} from '@/components/addons/event-features';
export default function EventFeaturesScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const addons = useEventAddons(eventId);
  return (
    <DetailScreenTemplate title='Event features'>
      {addons === undefined ? (
        <LoadingState />
      ) : (
        <>
          <EventPlanningFeatures eventId={eventId} addons={addons} />
          <EventParticipationFeatures eventId={eventId} addons={addons} />
        </>
      )}
    </DetailScreenTemplate>
  );
}
