'use client';
import { useParams } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupPollEditor } from '@/components/organisms/group-polls';
export default function Page() {
  const { eventId } = useParams<{ eventId: string; toolId: string }>();
  return <GroupPollEditor groupId={eventId as Id<'events'>} />;
}
