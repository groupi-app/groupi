'use client';
import { useParams } from 'next/navigation';
import { useConvexAuth } from 'convex/react';
import Link from 'next/link';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupQuestionnaireRecords } from '@/components/organisms/group-questionnaire-records';

export default function GroupQuestionnairePage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { isAuthenticated, isLoading } = useConvexAuth();
  if (isLoading) return <p role='status'>Loading…</p>;
  if (!isAuthenticated)
    return (
      <main className='p-6'>
        <Link
          className='text-primary underline'
          href={`/sign-in?redirect=${encodeURIComponent(`/groups/${groupId}/questionnaire`)}`}
        >
          Sign in or sign up to view your questionnaire records
        </Link>
      </main>
    );
  return <GroupQuestionnaireRecords groupId={groupId as Id<'groups'>} />;
}
