'use client';
import { useState } from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import { useJoiningQuestionnaireAnswers } from '@/hooks/convex/use-group-questionnaire';
import { Button } from '@/components/ui/button';
import { QuestionnaireAnswerSummary } from './group-questionnaire-answer-summary';
import { GroupQuestionnaireHistory } from './group-questionnaire-history';
import { GroupPagination } from './group-pagination';

export function GroupQuestionnaireReview({
  groupId,
}: {
  groupId: Id<'groups'>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className='space-y-3'>
      <Button
        variant='outline'
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open
          ? 'Hide member questionnaire answers'
          : 'Review member questionnaire answers'}
      </Button>
      {open && <MemberAnswersPage groupId={groupId} />}
    </section>
  );
}
function MemberAnswersPage({ groupId }: { groupId: Id<'groups'> }) {
  const [cursor, setCursor] = useState<string | null>(null);
  const records = useJoiningQuestionnaireAnswers({
    groupId,
    paginationOpts: { numItems: 20, cursor },
  });
  if (records === undefined)
    return <p role='status'>Loading member answers…</p>;
  return (
    <div className='space-y-4'>
      <p>Private answer review does not approve or reopen admission.</p>
      {records.page.length === 0 && <p>No questionnaire answers submitted.</p>}
      {records.page.map(record => (
        <article
          key={record.author.personId}
          className='rounded-card border border-border p-4 space-y-3'
        >
          <h3 className='font-semibold'>
            {record.author.name ||
              record.author.username ||
              'Unavailable member'}
          </h3>
          {record.author.username && (
            <p className='text-sm text-muted-foreground'>
              @{record.author.username}
            </p>
          )}
          <p>
            {record.completed
              ? 'Current questionnaire complete'
              : 'Current questionnaire incomplete'}
          </p>
          <QuestionnaireAnswerSummary form={record} />
          <GroupQuestionnaireHistory
            groupId={groupId}
            personId={record.author.personId}
          />
        </article>
      ))}
      <GroupPagination
        cursor={cursor}
        onCursor={setCursor}
        page={records}
        label='member answers'
      />
    </div>
  );
}
