'use client';
import type { ApplicationAnswers } from '@groupi/shared/hooks';
import { useJoiningQuestionnaire } from '@/hooks/convex/use-group-questionnaire';
type Form = NonNullable<ReturnType<typeof useJoiningQuestionnaire>>;
export function QuestionnaireAnswerSummary({ form }: { form: Form }) {
  return (
    <div className='space-y-3'>
      <h3 className='font-semibold'>Current answers</h3>
      {form.questions.length === 0 && <p>No current questions.</p>}
      <dl className='space-y-2'>
        {form.questions.map(question => (
          <div key={`${question.id}-${question.version}`}>
            <dt className='font-medium'>
              {question.label}{' '}
              <span className='text-sm text-muted-foreground'>
                (version {question.version})
              </span>
            </dt>
            <dd className='whitespace-pre-wrap'>
              {formatQuestionnaireAnswer(form.answers[question.id])}
            </dd>
          </div>
        ))}
      </dl>
      {form.savedQuestions.length > 0 && (
        <details>
          <summary>Last submitted question definitions</summary>
          <ul>
            {form.savedQuestions.map(question => (
              <li key={`${question.id}-${question.version}`}>
                {question.label} — version {question.version}
              </li>
            ))}
          </ul>
          <p>
            Original answers remain in your history even when questions change.
          </p>
        </details>
      )}
    </div>
  );
}
export function formatQuestionnaireAnswer(
  answer: ApplicationAnswers[string] | undefined
) {
  return answer === undefined || answer === ''
    ? 'Not answered'
    : Array.isArray(answer)
      ? answer.join(', ') || 'Not answered'
      : typeof answer === 'boolean'
        ? answer
          ? 'Yes'
          : 'No'
        : String(answer);
}
