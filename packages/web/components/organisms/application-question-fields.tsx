'use client';
import type {
  ApplicationQuestion,
  ApplicationAnswers,
} from '@groupi/shared/hooks';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { contentChoice } from '@/features/content/content-design';
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
            <fieldset
              key={q.id}
              disabled={disabled}
              className='min-w-0 space-y-3 rounded-input border border-border p-4'
            >
              <legend className='px-1 font-semibold'>
                {q.label}
                {q.required && ' (required)'}
              </legend>
              {q.options?.map(option => (
                <label key={option} className={contentChoice}>
                  <input
                    className='mt-1 size-4 shrink-0 accent-primary'
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
                  <span className='min-w-0 break-words'>{option}</span>
                </label>
              ))}
            </fieldset>
          );
        return (
          <div
            key={q.id}
            className='min-w-0 space-y-3 rounded-input border border-border p-4'
          >
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
  title = 'Admission questions',
  requiredLabel = 'Required',
  contentLayout = false,
}: {
  questions: ApplicationQuestion[];
  onChange: (questions: ApplicationQuestion[]) => void;
  disabled?: boolean;
  title?: string;
  requiredLabel?: string;
  contentLayout?: boolean;
}) {
  const update = (index: number, patch: Partial<ApplicationQuestion>) =>
    onChange(
      questions.map((question, i) =>
        i === index ? { ...question, ...patch } : question
      )
    );
  return (
    <fieldset disabled={disabled} className='space-y-4'>
      <legend className={contentLayout ? 'sr-only' : 'font-semibold'}>
        {title}
      </legend>
      {questions.map((q, index) => (
        <fieldset
          key={q.id}
          className={cn(
            'min-w-0 rounded-card border border-border p-4 space-y-3',
            contentLayout &&
              'rounded-input border-0 bg-transparent p-0 space-y-2'
          )}
        >
          <legend
            className={
              contentLayout
                ? 'sr-only'
                : 'px-2 text-sm font-semibold text-muted-foreground'
            }
          >
            Question {index + 1}
          </legend>
          <Label
            className={contentLayout ? 'sr-only' : undefined}
            htmlFor={`question-label-${q.id}`}
          >
            Question text
          </Label>
          <Textarea
            rows={1}
            className={
              contentLayout
                ? 'min-h-6 resize-y border-transparent bg-transparent px-0 text-base font-medium leading-snug field-sizing-content'
                : undefined
            }
            placeholder='Write your question…'
            id={`question-label-${q.id}`}
            required
            maxLength={1000}
            value={q.label}
            onChange={event => update(index, { label: event.target.value })}
          />
          <Label
            className={contentLayout ? 'sr-only' : undefined}
            htmlFor={`question-type-${q.id}`}
          >
            Question type
          </Label>
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
            {requiredLabel}
          </label>
          {choices(q.type) &&
            (contentLayout ? (
              <fieldset className='min-w-0 space-y-2'>
                <legend className='sr-only'>Answer options</legend>
                {(q.options ?? []).map((option, optionIndex) => (
                  <div key={optionIndex} className='space-y-1'>
                    <div className='flex min-w-0 items-center gap-2 rounded-input bg-bg-sunken px-3 py-2'>
                      <span
                        aria-hidden='true'
                        className={cn(
                          'size-4 shrink-0 border border-border',
                          q.type === 'MULTIPLE_CHOICE'
                            ? 'rounded-full'
                            : 'rounded-sm'
                        )}
                      />
                      <Label
                        className='sr-only'
                        htmlFor={`question-${q.id}-option-${optionIndex}`}
                      >
                        Question {index + 1} option {optionIndex + 1}
                      </Label>
                      <Textarea
                        id={`question-${q.id}-option-${optionIndex}`}
                        rows={1}
                        className='min-h-6 min-w-0 flex-1 resize-y border-transparent bg-transparent p-0 text-sm field-sizing-content'
                        required
                        value={option}
                        onChange={event =>
                          update(index, {
                            options: q.options?.map((value, i) =>
                              i === optionIndex ? event.target.value : value
                            ),
                          })
                        }
                      />
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='size-8 min-h-8 shrink-0'
                        aria-label={`Remove question ${index + 1} option ${optionIndex + 1}`}
                        onClick={() =>
                          update(index, {
                            options: q.options?.filter(
                              (_, i) => i !== optionIndex
                            ),
                          })
                        }
                      >
                        <X className='size-3' aria-hidden='true' />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type='button'
                  variant='outline'
                  onClick={() =>
                    update(index, { options: [...(q.options ?? []), ''] })
                  }
                >
                  Add answer option
                </Button>
              </fieldset>
            ) : (
              <>
                <Label htmlFor={`question-options-${q.id}`}>
                  Options (one per line)
                </Label>
                <Textarea
                  id={`question-options-${q.id}`}
                  className={contentLayout ? 'field-sizing-content' : undefined}
                  required
                  value={q.options?.join('\n') ?? ''}
                  onChange={event =>
                    update(index, { options: event.target.value.split('\n') })
                  }
                />
              </>
            ))}
          <Button
            type='button'
            variant={contentLayout ? 'ghost' : 'outline'}
            size={contentLayout ? 'sm' : 'default'}
            aria-label={`Remove question ${index + 1}`}
            onClick={() => onChange(questions.filter((_, i) => i !== index))}
          >
            {contentLayout ? (
              <X className='size-4' aria-hidden='true' />
            ) : (
              `Remove question ${index + 1}`
            )}
          </Button>
        </fieldset>
      ))}
      {contentLayout && questions.length === 0 && (
        <p className='rounded-input border border-dashed border-border p-6 text-sm text-muted-foreground'>
          Add your first question. Members will answer here.
        </p>
      )}
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
