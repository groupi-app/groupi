'use client';
import { useParams } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupListEditor } from '@/components/organisms/group-lists';
export default function Page() {
  const { eventId } = useParams<{ eventId: string; toolId: string }>();
  return <GroupListEditor groupId={eventId as Id<'events'>} />;
}
