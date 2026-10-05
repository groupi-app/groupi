'use client';
import { useState } from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import { useJoiningQuestionnaireHistory } from '@/hooks/convex/use-group-questionnaire';
import { Button } from '@/components/ui/button';
import { GroupPagination } from './group-pagination';
import { formatQuestionnaireAnswer } from './group-questionnaire-answer-summary';

export function GroupQuestionnaireHistory({
  groupId,
  personId,
}: {
  groupId: Id<'groups'>;
  personId?: Id<'persons'>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className='space-y-3'>
      <Button
        variant='outline'
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {open
          ? 'Hide answer history'
          : personId
            ? 'View member answer history'
            : 'View your answer history'}
      </Button>
      {open && (
        <QuestionnaireHistoryPage groupId={groupId} personId={personId} />
      )}
    </div>
  );
}
function QuestionnaireHistoryPage({
  groupId,
  personId,
}: {
  groupId: Id<'groups'>;
  personId?: Id<'persons'>;
}) {
  const [cursor, setCursor] = useState<string | null>(null);
  const history = useJoiningQuestionnaireHistory({
    groupId,
    ...(personId ? { personId } : {}),
    paginationOpts: { numItems: 20, cursor },
  });
  if (history === undefined)
    return <p role='status'>Loading answer history…</p>;
  return (
    <section className='space-y-3' aria-label='Questionnaire answer history'>
      {history.page.length === 0 && <p>No saved answer history.</p>}
      <ul className='space-y-3'>
        {history.page.map(entry => (
          <li
            key={entry._id}
            className='rounded-card border border-border p-3 space-y-1'
          >
            <p className='font-medium'>{entry.question.label}</p>
            <p className='text-sm text-muted-foreground'>
              Question version {entry.question.version} ·{' '}
              {entry.question.type.toLowerCase().replaceAll('_', ' ')} ·{' '}
              {new Date(entry.answeredAt).toLocaleString()}
            </p>
            {entry.question.options && (
              <p className='text-sm'>
                Original options: {entry.question.options.join(', ')}
              </p>
            )}
            <p className='whitespace-pre-wrap'>
              {formatQuestionnaireAnswer(entry.answer)}
            </p>
          </li>
        ))}
      </ul>
      <GroupPagination
        cursor={cursor}
        onCursor={setCursor}
        page={history}
        label='answer history'
      />
    </section>
  );
}
