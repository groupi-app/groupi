'use client';
import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupListEditor } from '@/components/organisms/group-lists';
function NewList() {
  const { groupId } = useParams<{ groupId: string }>();
  const requestedType = useSearchParams().get('type');
  const initialType =
    requestedType === 'SIMPLE' ||
    requestedType === 'CHECKLIST' ||
    requestedType === 'BRING'
      ? requestedType
      : undefined;
  return (
    <GroupListEditor
      groupId={groupId as Id<'groups'>}
      initialType={initialType}
    />
  );
}
export default function Page() {
  return (
    <Suspense fallback={<p role='status'>Loading list editor…</p>}>
      <NewList />
    </Suspense>
  );
}
