'use client';
import { useParams } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupLists } from '@/components/organisms/group-lists';
export default function Page() {
  const { groupId } = useParams<{ groupId: string; toolId: string }>();
  return <GroupLists groupId={groupId as Id<'groups'>} />;
}
