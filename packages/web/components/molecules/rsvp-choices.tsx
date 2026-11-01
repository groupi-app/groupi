'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';

/** Equal-width response choices with labels that stay intact on narrow dialogs. */
export function RsvpChoices({
  value,
  onChange,
}: {
  value: 'YES' | 'MAYBE' | 'NO' | 'PENDING';
  onChange: (value: 'YES' | 'MAYBE' | 'NO') => void;
}) {
  return (
    <div role='group' aria-label='Your RSVP' className='grid grid-cols-3 gap-2'>
      {(['YES', 'MAYBE', 'NO'] as const).map(response => (
        <Button
          key={response}
          type='button'
          data-nowrap
          aria-pressed={value === response}
          variant={value === response ? 'default' : 'outline'}
          className='min-w-0 gap-1 px-2'
          onClick={() => onChange(response)}
        >
          {response === 'YES' ? (
            <Icons.check aria-hidden className='shrink-0 text-success' />
          ) : response === 'NO' ? (
            <Icons.close aria-hidden className='shrink-0 text-error' />
          ) : (
            <span aria-hidden className='shrink-0 text-xl text-warning'>
              ?
            </span>
          )}
          <span>
            {response === 'YES' ? 'Yes' : response === 'NO' ? 'No' : 'Maybe'}
          </span>
        </Button>
      ))}
    </div>
  );
}
