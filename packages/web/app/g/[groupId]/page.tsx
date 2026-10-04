'use client';

import { useParams } from 'next/navigation';
import { Id } from '@/convex/_generated/dataModel';
import { GroupLanding } from '@/components/organisms/group-landing';

export default function GroupLandingPage() {
  const { groupId } = useParams<{ groupId: string }>();
  return <GroupLanding groupId={groupId as Id<'groups'>} />;
}
