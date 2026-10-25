'use client';
import { useParams } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupForms } from '@/components/organisms/group-forms';
export default function Page() {
  const { eventId } = useParams<{ eventId: string; toolId: string }>();
  return <GroupForms groupId={eventId as Id<'events'>} />;
}
