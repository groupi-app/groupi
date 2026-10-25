import type { Doc } from '../_generated/dataModel';
export function compareAvailabilityRecency(
  left: Doc<'availabilities'>,
  right: Doc<'availabilities'>
): number {
  const timestampDifference =
    (left.updatedAt ?? left._creationTime) -
    (right.updatedAt ?? right._creationTime);

  if (timestampDifference !== 0) return timestampDifference;

  const creationTimeDifference = left._creationTime - right._creationTime;
  if (creationTimeDifference !== 0) return creationTimeDifference;

  return String(left._id).localeCompare(String(right._id));
}
