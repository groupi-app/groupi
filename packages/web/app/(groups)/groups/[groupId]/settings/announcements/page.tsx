'use client';
import { useParams } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupAnnouncementsSettings } from '@/features/groups';
export default function Page() {
  const { groupId } = useParams<{ groupId: string }>();
  return <GroupAnnouncementsSettings groupId={groupId as Id<'groups'>} />;
}
