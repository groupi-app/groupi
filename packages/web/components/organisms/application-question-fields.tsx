'use client';
import type {
  ApplicationQuestion,
  ApplicationAnswers,
} from '@groupi/shared/hooks';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
const selectClass =
  'w-full rounded-input border border-input bg-background p-2 text-foreground';
const choices = (type: ApplicationQuestion['type']) =>
  ['MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN'].includes(type);
export function ApplicationQuestionFields({
  questions,
  answers,
  onChange,
  disabled,
}: {
  questions: ApplicationQuestion[];
  answers: ApplicationAnswers;
  onChange: (answers: ApplicationAnswers) => void;
  disabled?: boolean;
}) {
  const set = (id: string, value: ApplicationAnswers[string] | undefined) => {
    const next = { ...answers };
    if (value === undefined) delete next[id];
    else next[id] = value;
    onChange(next);
  };
  return (
    <div className='space-y-4'>
      {questions.map(q => {
        const id = `application-answer-${q.id}`;
        const value = answers[q.id];
        if (q.type === 'CHECKBOXES')
          return (
            <fieldset key={q.id} disabled={disabled} className='space-y-2'>
              <legend>
                {q.label}
                {q.required && ' (required)'}
              </legend>
              {q.options?.map(option => (
                <label key={option} className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    checked={Array.isArray(value) && value.includes(option)}
                    onChange={event =>
                      set(
                        q.id,
                        event.target.checked
                          ? [...(Array.isArray(value) ? value : []), option]
                          : (Array.isArray(value) ? value : []).filter(
                              item => item !== option
                            )
                      )
                    }
                  />
                  {option}
                </label>
              ))}
            </fieldset>
          );
        return (
          <div key={q.id} className='space-y-2'>
            <Label htmlFor={id}>{q.label}</Label>
            {q.required && (
              <span className='text-sm text-muted-foreground'> (required)</span>
            )}
            {q.type === 'LONG_ANSWER' ? (
              <Textarea
                id={id}
                required={q.required}
                disabled={disabled}
                maxLength={10000}
                value={typeof value === 'string' ? value : ''}
                onChange={event => set(q.id, event.target.value)}
              />
            ) : choices(q.type) || q.type === 'YES_NO' ? (
              <select
                id={id}
                className={selectClass}
                required={q.required}
                disabled={disabled}
                value={value === undefined ? '' : String(value)}
                onChange={event =>
                  set(
                    q.id,
                    event.target.value === ''
                      ? undefined
                      : q.type === 'YES_NO'
                        ? event.target.value === 'true'
                        : event.target.value
                  )
                }
              >
                <option value=''>Choose an answer</option>
                {q.type === 'YES_NO' ? (
                  <>
                    <option value='true'>Yes</option>
                    <option value='false'>No</option>
                  </>
                ) : (
                  q.options?.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))
                )}
              </select>
            ) : (
              <Input
                id={id}
                required={q.required}
                disabled={disabled}
                type={q.type === 'NUMBER' ? 'number' : 'text'}
                step={q.type === 'NUMBER' ? 'any' : undefined}
                maxLength={q.type === 'SHORT_ANSWER' ? 1000 : undefined}
                value={
                  typeof value === 'string' || typeof value === 'number'
                    ? value
                    : ''
                }
                onChange={event =>
                  set(
                    q.id,
                    q.type === 'NUMBER'
                      ? event.target.value === ''
                        ? undefined
                        : Number(event.target.value)
                      : event.target.value
                  )
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
export function ApplicationQuestionEditor({
  questions,
  onChange,
  disabled,
}: {
  questions: ApplicationQuestion[];
  onChange: (questions: ApplicationQuestion[]) => void;
  disabled?: boolean;
}) {
  const update = (index: number, patch: Partial<ApplicationQuestion>) =>
    onChange(
      questions.map((question, i) =>
        i === index ? { ...question, ...patch } : question
      )
    );
  return (
    <fieldset disabled={disabled} className='space-y-4'>
      <legend className='font-semibold'>Admission questions</legend>
      {questions.map((q, index) => (
        <fieldset
          key={q.id}
          className='rounded-card border border-border p-3 space-y-2'
        >
          <legend>Question {index + 1}</legend>
          <Label htmlFor={`question-label-${q.id}`}>Question text</Label>
          <Input
            id={`question-label-${q.id}`}
            required
            maxLength={1000}
            value={q.label}
            onChange={event => update(index, { label: event.target.value })}
          />
          <Label htmlFor={`question-type-${q.id}`}>Question type</Label>
          <select
            id={`question-type-${q.id}`}
            className={selectClass}
            value={q.type}
            onChange={event => {
              const type = event.target.value as ApplicationQuestion['type'];
              update(index, {
                type,
                options: choices(type) ? (q.options ?? ['']) : undefined,
              });
            }}
          >
            {(
              [
                'SHORT_ANSWER',
                'LONG_ANSWER',
                'MULTIPLE_CHOICE',
                'CHECKBOXES',
                'NUMBER',
                'DROPDOWN',
                'YES_NO',
              ] as const
            ).map(type => (
              <option key={type} value={type}>
                {type.toLowerCase().replaceAll('_', ' ')}
              </option>
            ))}
          </select>
          <label className='flex items-center gap-2'>
            <input
              type='checkbox'
              checked={q.required}
              onChange={event =>
                update(index, { required: event.target.checked })
              }
            />
            Required
          </label>
          {choices(q.type) && (
            <>
              <Label htmlFor={`question-options-${q.id}`}>
                Options (one per line)
              </Label>
              <Textarea
                id={`question-options-${q.id}`}
                required
                value={q.options?.join('\n') ?? ''}
                onChange={event =>
                  update(index, { options: event.target.value.split('\n') })
                }
              />
            </>
          )}
          <Button
            type='button'
            variant='outline'
            onClick={() => onChange(questions.filter((_, i) => i !== index))}
          >
            Remove question {index + 1}
          </Button>
        </fieldset>
      ))}
      <Button
        type='button'
        variant='outline'
        disabled={questions.length >= 50}
        onClick={() =>
          onChange([
            ...questions,
            {
              id: crypto.randomUUID(),
              label: '',
              type: 'SHORT_ANSWER',
              required: false,
            },
          ])
        }
      >
        Add question
      </Button>
    </fieldset>
  );
}
