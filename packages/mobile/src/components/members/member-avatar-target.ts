import type { Id } from 'convex/_generated/dataModel';

import type { MemberDrawerTarget } from '@/components/events/member-drawer';

export function createMemberDrawerTarget({
  personId,
  name,
  image,
  eventMembership,
}: {
  personId: Id<'persons'>;
  name?: string | null;
  image?: string | null;
  eventMembership?: MemberDrawerTarget['eventMembership'];
}): MemberDrawerTarget {
  return { personId, name, image, eventMembership };
}
