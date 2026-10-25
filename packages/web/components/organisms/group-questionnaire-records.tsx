'use client';
import Link from 'next/link';
import type { Id } from '@/convex/_generated/dataModel';
import { useJoiningQuestionnaireAccess } from '@/hooks/convex/use-group-questionnaire';
import { GroupJoiningQuestionnaire } from './group-joining-questionnaire';

export function GroupQuestionnaireRecords({
  groupId,
}: {
  groupId: Id<'groups'>;
}) {
  const access = useJoiningQuestionnaireAccess({ groupId });
  if (access === undefined)
    return <p role='status'>Checking your questionnaire access…</p>;
  return (
    <main className='mx-auto max-w-2xl p-6 space-y-4'>
      <h1 className='text-2xl font-semibold'>
        Your Group questionnaire records
      </h1>
      <Link className='text-primary underline' href={`/g/${groupId}`}>
        Group landing page
      </Link>
      {access.canRead ? (
        <>
          {!access.isMember && (
            <p>
              You retain your own answers after leaving. This does not restore
              Group membership. You can edit again after returning under the
              current admission policy.
            </p>
          )}
          <GroupJoiningQuestionnaire groupId={groupId} />
        </>
      ) : (
        <p role='alert'>
          No questionnaire records are available to you for this Group.
        </p>
      )}
    </main>
  );
}
