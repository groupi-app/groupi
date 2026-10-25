'use client';
import { useParams } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupListOwnEntries } from '@/components/organisms/group-lists';
export default function Page() {
  const { toolId } = useParams<{ groupId: string; toolId: string }>();
  return <GroupListOwnEntries toolId={toolId as Id<'groupTools'>} />;
}
