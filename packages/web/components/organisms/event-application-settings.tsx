'use client';
import { useState } from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import type { ApplicationQuestion } from '@groupi/shared/hooks';
import {
  useApplicationForm,
  useConfigureApplications,
} from '@/hooks/convex/use-event-applications';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ApplicationQuestionEditor } from './application-question-fields';
export function EventApplicationSettings({
  eventId,
}: {
  eventId: Id<'events'>;
}) {
  const form = useApplicationForm({ eventId });
  if (form === undefined)
    return <p role='status'>Loading application settings…</p>;
  return (
    <ApplicationSettingsForm
      key={JSON.stringify(form.settings)}
      eventId={eventId}
      settings={form.settings}
    />
  );
}
function ApplicationSettingsForm({
  eventId,
  settings,
}: {
  eventId: Id<'events'>;
  settings: {
    questions: ApplicationQuestion[];
    reviewerPolicy: 'ORGANIZERS_AND_MODERATORS' | 'ORGANIZER_ONLY';
  };
}) {
  const configure = useConfigureApplications();
  const [questions, setQuestions] = useState(settings.questions);
  const [reviewerPolicy, setPolicy] = useState(settings.reviewerPolicy);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  return (
    <form
      className='rounded-card border border-border p-4 space-y-4'
      onSubmit={async event => {
        event.preventDefault();
        setBusy(true);
        setError('');
        setMessage('');
        try {
          await configure({ eventId, questions, reviewerPolicy });
          setMessage(
            'Application form saved. Pending and reviewed applications keep their original questions.'
          );
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'Unable to save application form.'
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className='text-lg font-semibold'>Approval application form</h2>
      <p>
        These private admission questions are separate from member
        questionnaires and add-ons. Enable Apply for approval in Event admission
        to accept applications.
      </p>
      <Label htmlFor='application-reviewers'>Application reviewers</Label>
      <select
        id='application-reviewers'
        className='w-full rounded-input border border-input bg-background p-2 text-foreground'
        value={reviewerPolicy}
        disabled={busy}
        onChange={event =>
          setPolicy(event.target.value as typeof reviewerPolicy)
        }
      >
        <option value='ORGANIZERS_AND_MODERATORS'>
          Organizer and Moderators
        </option>
        <option value='ORGANIZER_ONLY'>Organizer only</option>
      </select>
      <ApplicationQuestionEditor
        questions={questions}
        onChange={setQuestions}
        disabled={busy}
      />
      <Button disabled={busy}>
        {busy ? 'Saving…' : 'Save application form'}
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
