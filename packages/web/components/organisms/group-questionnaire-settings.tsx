'use client';
import { useState } from 'react';
import type { ApplicationQuestion } from '@groupi/shared/hooks';
import { validateQuestions } from '@groupi/shared/utils';
import {
  useConfigureJoiningQuestionnaire,
  useJoiningQuestionnaire,
} from '@/hooks/convex/use-group-questionnaire';
import { Button } from '@/components/ui/button';
import { ApplicationQuestionEditor } from './application-question-fields';

type Form = NonNullable<ReturnType<typeof useJoiningQuestionnaire>>;
export function GroupQuestionnaireSettings({ form }: { form: Form }) {
  const configure = useConfigureJoiningQuestionnaire();
  const [enabled, setEnabled] = useState(form.enabled);
  const [questions, setQuestions] = useState<ApplicationQuestion[]>(
    form.questions.map(({ id, label, type, required, options }) => ({
      id,
      label,
      type,
      required,
      ...(options ? { options } : {}),
    }))
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  return (
    <form
      className='rounded-card border border-border p-4 space-y-4'
      onSubmit={async event => {
        event.preventDefault();
        setError('');
        setMessage('');
        try {
          validateQuestions(questions);
        } catch {
          setError(
            'Each question needs text and a unique identity. Choice questions need distinct, nonempty options.'
          );
          return;
        }
        setPending(true);
        try {
          await configure({ groupId: form.groupId, enabled, questions });
          setMessage(
            'Questionnaire settings saved. Existing answers and answered definitions are preserved.'
          );
        } catch {
          setError(
            'Unable to save questionnaire settings. Your access may have changed. Please try again.'
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <h3 className='font-semibold'>Joining questionnaire settings</h3>
      <p className='text-sm text-muted-foreground'>
        This is optional after admission. Disabling or editing questions
        preserves previous answers and their original definitions.
      </p>
      <label className='flex items-center gap-2'>
        <input
          type='checkbox'
          checked={enabled}
          disabled={pending}
          onChange={event => setEnabled(event.target.checked)}
        />
        Enable optional joining questionnaire
      </label>
      <ApplicationQuestionEditor
        title='Joining questions'
        requiredLabel='Answer required when submitting this optional questionnaire'
        questions={questions}
        onChange={setQuestions}
        disabled={pending}
      />
      <Button disabled={pending}>
        {pending ? 'Saving…' : 'Save questionnaire settings'}
      </Button>
      {error && (
        <p role='alert' className='text-error'>
          {error}
        </p>
      )}
      {message && <p role='status'>{message}</p>}
    </form>
  );
}
