'use client';
import { useParams } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupListEditor } from '@/components/organisms/group-lists';
export default function Page() {
  const { groupId, toolId } = useParams<{ groupId: string; toolId: string }>();
  return (
    <GroupListEditor
      groupId={groupId as Id<'groups'>}
      toolId={toolId as Id<'groupTools'>}
    />
  );
}
