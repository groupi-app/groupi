'use client';
import { useParams } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupPollHistory } from '@/components/organisms/group-polls';
export default function Page() {
  const { toolId } = useParams<{ groupId: string; toolId: string }>();
  return <GroupPollHistory toolId={toolId as Id<'groupTools'>} />;
}
