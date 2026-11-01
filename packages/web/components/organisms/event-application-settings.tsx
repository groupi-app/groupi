'use client';
import type { Id } from '@/convex/_generated/dataModel';
import { Label } from '@/components/ui/label';
import { ApplicationQuestionEditor } from './application-question-fields';
import { useEventSettingsDraft } from '@/features/event-settings';

export function EventApplicationSettings({
  eventId,
}: {
  eventId: Id<'events'>;
}) {
  const { values, setSection, busy, epoch } = useEventSettingsDraft();
  const settings = values.applications;
  if (!settings) return null;
  return (
    <div className='space-y-2'>
      <p className='text-sm text-muted-foreground'>
        Ask applicants questions before they join. Existing applications keep
        their original questions.
      </p>
      <details
        id={`${eventId}-application-questions`}
        key={epoch}
        className='min-w-0 rounded-input border border-border'
      >
        <summary className='cursor-pointer px-3 py-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring'>
          Application questions{' '}
          <span className='text-muted-foreground'>
            ({settings.questions.length})
          </span>
        </summary>
        <fieldset disabled={busy} className='min-w-0 space-y-4 px-3 pb-3'>
          <div className='space-y-2'>
            <Label htmlFor='application-reviewers'>Reviewers</Label>
            <select
              id='application-reviewers'
              className='w-full rounded-input border border-input bg-background p-2 text-foreground'
              value={settings.reviewerPolicy}
              onChange={event =>
                setSection('applications', {
                  ...settings,
                  reviewerPolicy: event.target
                    .value as typeof settings.reviewerPolicy,
                })
              }
            >
              <option value='ORGANIZERS_AND_MODERATORS'>
                Organizer and moderators
              </option>
              <option value='ORGANIZER_ONLY'>Organizer only</option>
            </select>
          </div>
          <ApplicationQuestionEditor
            questions={settings.questions}
            onChange={questions =>
              setSection('applications', { ...settings, questions })
            }
            disabled={busy}
            title='Application questions'
            contentLayout
          />
        </fieldset>
      </details>
    </div>
  );
}
