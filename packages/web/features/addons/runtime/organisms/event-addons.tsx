'use client';

import { useEventAddons } from '../../hooks/use-addons';
import type { Id } from '@/convex/_generated/dataModel';
import type { useEventHeaderData } from '@/hooks/convex/use-events';
import {
  FeatureRenderingBoundary,
  UnavailableEventFeature,
} from '../feature-rendering-boundary';
import { getAddonById } from '../catalog';
import {
  canRenderParticipantFeature,
  isPlanningFeature,
  featureInCollection,
  participantFeatureTitle,
} from '../participant-features';

type HeaderData = NonNullable<ReturnType<typeof useEventHeaderData>>;
interface EventFeaturesProps {
  data: HeaderData;
}

export type EventFeaturePlacement =
  | 'planning'
  | 'content'
  | 'forms'
  | 'lists'
  | 'polls';

/** Participant features mount in their Event context, without a management toolbar. */
export function EventFeatureCards({
  eventId,
  chosenDateTime,
  configs,
  placement,
}: {
  eventId: Id<'events'>;
  chosenDateTime?: number;
  configs: NonNullable<ReturnType<typeof useEventAddons>>;
  placement: EventFeaturePlacement;
}) {
  const features = configs.filter(
    row =>
      row.enabled &&
      (placement === 'planning'
        ? isPlanningFeature(row.addonType)
        : placement === 'content'
          ? !isPlanningFeature(row.addonType)
          : featureInCollection(row.addonType, row.config, placement))
  );
  if (!features.length) return null;
  return (
    <div className='flex flex-wrap items-start gap-3'>
      {features.map(row => {
        const definition = canRenderParticipantFeature(
          row.addonType,
          row.config
        )
          ? getAddonById(row.addonType, row.config as Record<string, unknown>)
          : undefined;
        if (!definition)
          return (
            <UnavailableEventFeature
              key={row.addonType}
              title={participantFeatureTitle(row.addonType, row.config)}
            />
          );
        return (
          <FeatureRenderingBoundary
            key={`${eventId}:${row.addonType}:${row.updatedAt}`}
            title={participantFeatureTitle(row.addonType, row.config)}
          >
            <definition.EventCardComponent
              addonType={row.addonType}
              eventId={eventId}
              config={row.config as Record<string, unknown>}
              chosenDateTime={chosenDateTime}
            />
          </FeatureRenderingBoundary>
        );
      })}
    </div>
  );
}
function EventFeatures({
  data,
  placement,
}: EventFeaturesProps & { placement: EventFeaturePlacement }) {
  const configs = useEventAddons(data.event._id);
  return (
    <EventFeatureCards
      eventId={data.event._id}
      chosenDateTime={data.event.chosenDateTime}
      configs={configs ?? []}
      placement={placement}
    />
  );
}
export function EventPlanningFeatures(props: EventFeaturesProps) {
  return <EventFeatures {...props} placement='planning' />;
}
export function EventContentFeatures(props: EventFeaturesProps) {
  return <EventFeatures {...props} placement='content' />;
}
export function EventCollectionFeatures({
  eventId,
  collection,
}: {
  eventId: Id<'events'>;
  collection: 'forms' | 'lists' | 'polls';
}) {
  const configs = useEventAddons(eventId);
  return (
    <EventFeatureCards
      eventId={eventId}
      configs={configs ?? []}
      placement={collection}
    />
  );
}
/** Compatibility export for older page compositions; no generic Add-ons section. */
export function EventAddons(props: EventFeaturesProps) {
  return (
    <>
      <EventPlanningFeatures {...props} />
      <EventContentFeatures {...props} />
    </>
  );
}
