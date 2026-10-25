import type { ComponentProps } from 'react';
import {
  EventPlanningFeatures,
  EventParticipationFeatures,
} from './event-features';

/** Compatibility composition preserves all participant features without the old catalogue. */
export function EventAddonsSection(
  props: ComponentProps<typeof EventParticipationFeatures>
) {
  return (
    <>
      <EventPlanningFeatures {...props} />
      <EventParticipationFeatures {...props} />
    </>
  );
}
