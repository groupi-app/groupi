'use client';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEventSettingsDraft, type EventDateDraft } from './draft';
import { localDateValue as localDate } from './date-values';
export function EventDateFields({ mode }: { mode: 'SINGLE' | 'POLL' }) {
  const { snapshot, values, dateForm, setDateForm, busy } =
    useEventSettingsDraft();
  const initial: EventDateDraft = {
    mode,
    start: localDate(snapshot.date.chosenDateTime),
    end: localDate(snapshot.date.chosenEndDateTime),
    options: snapshot.date.options.map(option => ({
      id: option.id,
      start: localDate(option.start),
      end: localDate(option.end),
      note: option.note ?? '',
    })),
  };
  const form = dateForm?.mode === mode ? dateForm : initial;
  const update = (next: EventDateDraft) =>
    setDateForm(JSON.stringify(next) === JSON.stringify(initial) ? null : next);
  if (values.role !== 'ORGANIZER')
    return (
      <p className='text-sm text-muted-foreground'>
        Only the organizer can change event dates.
      </p>
    );
  return (
    <fieldset disabled={busy} className='min-w-0 space-y-4'>
      <p className='text-sm text-muted-foreground'>
        Times are shown in your timezone.
      </p>
      {mode === 'SINGLE' ? (
        <div className='grid min-w-0 gap-4 sm:grid-cols-2'>
          <DateField
            id='event-start'
            label='Start'
            value={form.start}
            required
            onChange={start => update({ ...form, start })}
          />
          <DateField
            id='event-end'
            label='End (optional)'
            value={form.end}
            onChange={end => update({ ...form, end })}
          />
        </div>
      ) : (
        <>
          {form.options.map((option, index) => (
            <div
              key={option.id ?? index}
              className='min-w-0 space-y-3 rounded-input border border-border p-3'
            >
              <div className='flex items-center justify-between gap-2'>
                <span className='text-sm font-medium'>Option {index + 1}</span>
                <Button
                  variant='ghost'
                  size='icon'
                  aria-label={`Remove date option ${index + 1}`}
                  onClick={() =>
                    update({
                      ...form,
                      options: form.options.filter((_, i) => i !== index),
                    })
                  }
                >
                  <X className='size-4' aria-hidden />
                </Button>
              </div>
              <div className='grid min-w-0 gap-3 sm:grid-cols-2'>
                <DateField
                  id={`option-start-${index}`}
                  label='Start'
                  value={option.start}
                  required
                  onChange={start =>
                    update({
                      ...form,
                      options: form.options.map((value, i) =>
                        i === index ? { ...value, start } : value
                      ),
                    })
                  }
                />
                <DateField
                  id={`option-end-${index}`}
                  label='End (optional)'
                  value={option.end}
                  onChange={end =>
                    update({
                      ...form,
                      options: form.options.map((value, i) =>
                        i === index ? { ...value, end } : value
                      ),
                    })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor={`option-note-${index}`}>Note (optional)</Label>
                <Input
                  id={`option-note-${index}`}
                  maxLength={200}
                  value={option.note}
                  onChange={event =>
                    update({
                      ...form,
                      options: form.options.map((value, i) =>
                        i === index
                          ? { ...value, note: event.target.value }
                          : value
                      ),
                    })
                  }
                />
              </div>
            </div>
          ))}
          <Button
            variant='outline'
            onClick={() =>
              update({
                ...form,
                options: [...form.options, { start: '', end: '', note: '' }],
              })
            }
          >
            <Plus className='size-4' aria-hidden />
            Add date option
          </Button>
        </>
      )}
    </fieldset>
  );
}
function DateField({
  id,
  label,
  value,
  required,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className='min-w-0 space-y-2'>
      <Label htmlFor={id}>{label}</Label>
      <Input
        className='min-w-0 max-w-full'
        id={id}
        type='datetime-local'
        value={value}
        required={required}
        onChange={event => onChange(event.target.value)}
      />
    </div>
  );
}
