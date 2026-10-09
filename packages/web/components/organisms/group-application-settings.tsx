'use client';
import { useState } from 'react';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { useConfigureGroupApplications } from '@/hooks/convex/use-group-applications';
import { Button } from '@/components/ui/button';
import { ApplicationQuestionEditor } from './application-question-fields';
export function GroupApplicationSettings({
  groupId,
  applicationsEnabled,
  questions,
}: {
  groupId: Id<'groups'>;
  applicationsEnabled: boolean;
  questions: Doc<'groupApplications'>['questions'];
}) {
  const configure = useConfigureGroupApplications();
  const [enabled, setEnabled] = useState(applicationsEnabled);
  const [draftQuestions, setQuestions] = useState(questions);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  return (
    <form
      className='rounded-card border border-border p-4 space-y-4'
      aria-labelledby='group-application-settings-heading'
      onSubmit={async event => {
        event.preventDefault();
        setBusy(true);
        setError('');
        setMessage('');
        try {
          await configure({
            groupId,
            applicationsEnabled: enabled,
            questions: draftQuestions,
          });
          setMessage(
            'Group application settings saved. Existing applications retain their original questions.'
          );
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'Unable to save Group application settings.'
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2
        id='group-application-settings-heading'
        className='text-xl font-semibold'
      >
        Group application settings
      </h2>
      <p>
        Voluntary applications are independent of incoming invitation
        preferences. Manager invitations remain usable. These private admission
        questions are separate from any later member questionnaire.
      </p>
      <label className='flex gap-2 items-center'>
        <input
          type='checkbox'
          checked={enabled}
          disabled={busy}
          onChange={event => setEnabled(event.target.checked)}
        />
        Accept Group applications
      </label>
      <ApplicationQuestionEditor
        questions={draftQuestions}
        onChange={setQuestions}
        disabled={busy}
      />
      <Button disabled={busy}>
        {busy ? 'Saving…' : 'Save Group application settings'}
      </Button>
      {message && <p role='status'>{message}</p>}
      {error && (
        <p role='alert' className='text-error'>
          {error}
        </p>
      )}
    </form>
  );
}
