'use client';
import { useParams } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupPollInteraction } from '@/components/organisms/group-polls';
export default function Page() {
  const { groupId, toolId } = useParams<{ groupId: string; toolId: string }>();
  return (
    <GroupPollInteraction
      groupId={groupId as Id<'groups'>}
      toolId={toolId as Id<'groupTools'>}
    />
  );
}
