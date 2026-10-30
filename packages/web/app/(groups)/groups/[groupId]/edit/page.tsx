'use client';
import { useParams } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupManagementLayout, GroupEdit } from '@/features/groups';
export default function Page() {
  const { groupId } = useParams<{ groupId: string }>();
  return (
    <GroupManagementLayout editing>
      <GroupEdit groupId={groupId as Id<'groups'>} />
    </GroupManagementLayout>
  );
}
