'use client';
import { useParams } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupFormHistory } from '@/components/organisms/group-forms';
export default function Page() {
  const { toolId } = useParams<{ groupId: string; toolId: string }>();
  return <GroupFormHistory toolId={toolId as Id<'groupTools'>} />;
}
