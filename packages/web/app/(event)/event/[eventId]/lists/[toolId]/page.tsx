'use client';
import { useParams } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupListInteraction } from '@/components/organisms/group-lists';
export default function Page() {
  const { eventId, toolId } = useParams<{ eventId: string; toolId: string }>();
  return (
    <GroupListInteraction
      groupId={eventId as Id<'events'>}
      toolId={toolId as Id<'groupTools'>}
    />
  );
}
