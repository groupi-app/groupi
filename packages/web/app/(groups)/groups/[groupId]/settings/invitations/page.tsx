'use client';
import { useParams } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupInvitationsSettings } from '@/features/groups';
export default function Page() {
  const { groupId } = useParams<{ groupId: string }>();
  return <GroupInvitationsSettings groupId={groupId as Id<'groups'>} />;
}
