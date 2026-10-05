'use client';
import { useParams } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupForms } from '@/components/organisms/group-forms';
export default function Page() {
  const { groupId } = useParams<{ groupId: string; toolId: string }>();
  return <GroupForms groupId={groupId as Id<'groups'>} />;
}
