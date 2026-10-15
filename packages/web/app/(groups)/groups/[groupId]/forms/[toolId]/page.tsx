'use client';
import { useParams } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupFormInteraction } from '@/components/organisms/group-forms';
export default function Page() {
  const { groupId, toolId } = useParams<{ groupId: string; toolId: string }>();
  return (
    <GroupFormInteraction
      groupId={groupId as Id<'groups'>}
      toolId={toolId as Id<'groupTools'>}
    />
  );
}
