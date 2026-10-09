'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Id } from '@/convex/_generated/dataModel';
import { validateAnswers } from '@groupi/shared/utils';
import type { ApplicationAnswers } from '@groupi/shared/hooks';
import { Button } from '@/components/ui/button';
import {
  useJoiningQuestionnaire,
  useSubmitJoiningQuestionnaire,
} from '@/hooks/convex/use-group-questionnaire';
import { QuestionnaireAnswerSummary } from './group-questionnaire-answer-summary';
import { GroupQuestionnaireReview } from './group-questionnaire-review';
import { GroupQuestionnaireHistory } from './group-questionnaire-history';
import { GroupQuestionnaireSettings } from './group-questionnaire-settings';
import { ApplicationQuestionFields } from './application-question-fields';

type Form = NonNullable<ReturnType<typeof useJoiningQuestionnaire>>;
export function GroupJoiningQuestionnaire({
  groupId,
}: {
  groupId: Id<'groups'>;
}) {
  const form = useJoiningQuestionnaire({ groupId });
  if (form === undefined)
    return <p role='status'>Loading joining questionnaire…</p>;
  return (
    <section
      className='space-y-4'
      aria-labelledby='joining-questionnaire-heading'
    >
      <h2 id='joining-questionnaire-heading' className='text-lg font-semibold'>
        Joining questionnaire
      </h2>
      {form.shouldPrompt && (
        <p>
          {form.requiresCompletion
            ? 'Complete required onboarding before accessing Group member content. You are already a Group member; no further approval is needed.'
            : 'You are already a Group member. This questionnaire is optional and does not require another admission approval. You can complete it later.'}
        </p>
      )}
      {!form.enabled && (
        <p>
          The questionnaire is disabled. Your saved answers and history are
          preserved.
        </p>
      )}
      {form.enabled && form.completed && (
        <p>
          Your answers are saved.
          {form.canEdit && ' Editing them does not reopen admission.'}
        </p>
      )}
      <JoiningAnswersForm
        key={JSON.stringify([form.version, form.answers, form.canEdit])}
        form={form}
      />
      <GroupQuestionnaireHistory groupId={groupId} />
      {form.canReview && <GroupQuestionnaireReview groupId={groupId} />}
      {form.canConfigure && (
        <GroupQuestionnaireSettings
          key={`settings-${form.version}`}
          form={form}
        />
      )}
      <Link
        className='text-primary underline'
        href={`/groups/${groupId}/questionnaire`}
      >
        Your questionnaire records and history
      </Link>
    </section>
  );
}
export function JoiningAnswersForm({ form }: { form: Form }) {
  const submit = useSubmitJoiningQuestionnaire();
  const [answers, setAnswers] = useState<ApplicationAnswers>(form.answers);
  const [show, setShow] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  if (!form.canEdit) return <QuestionnaireAnswerSummary form={form} />;
  if (!show)
    return (
      <Button variant='outline' onClick={() => setShow(true)}>
        {form.requiredCompletion
          ? 'Complete or edit joining questionnaire'
          : 'Complete or edit optional questionnaire'}
      </Button>
    );
  return (
    <form
      className='space-y-4'
      onSubmit={async event => {
        event.preventDefault();
        setError('');
        setMessage('');
        try {
          validateAnswers(form.questions, answers);
        } catch {
          setError('Please complete the marked questions using valid answers.');
          return;
        }
        setPending(true);
        try {
          await submit({
            groupId: form.groupId,
            version: form.version,
            answers,
          });
          setMessage('Answers saved. Your Group membership is unchanged.');
        } catch {
          setError(
            'Unable to save answers. The questions or your access may have changed. Review the current form and try again.'
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <ApplicationQuestionFields
        questions={form.questions}
        answers={answers}
        onChange={setAnswers}
        disabled={pending}
      />
      {form.questions.length === 0 && <p>No questions are configured.</p>}
      <div className='flex flex-wrap gap-2'>
        <Button disabled={pending}>
          {pending ? 'Saving…' : 'Save questionnaire answers'}
        </Button>
        {!form.requiresCompletion && (
          <Button
            type='button'
            variant='outline'
            disabled={pending}
            onClick={() => setShow(false)}
          >
            Do this later
          </Button>
        )}
      </div>
      {message && <p role='status'>{message}</p>}
      {error && (
        <p role='alert' className='text-error'>
          {error}
        </p>
      )}
    </form>
  );
}
