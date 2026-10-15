'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

export function GroupConfirmedAction({
  label,
  confirmation,
  explanation,
  onConfirm,
}: {
  label: string;
  confirmation: string;
  explanation: string;
  onConfirm: () => Promise<unknown>;
}) {
  const restoreFocus = useRef(false);
  const container = useRef<HTMLDivElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (confirming || restoreFocus.current) {
      container.current
        ?.querySelector<HTMLButtonElement>(
          confirming ? '[data-confirm-action]' : '[data-trigger-action]'
        )
        ?.focus();
      restoreFocus.current = false;
    }
  }, [confirming]);
  if (done) return <p role='status'>{label} completed.</p>;
  return (
    <div ref={container} className='flex min-w-0 flex-col gap-2'>
      {confirming ? (
        <div
          className='flex min-w-0 flex-col gap-2 rounded-card border border-border p-3'
          role='group'
          aria-label={confirmation}
        >
          <p className='text-sm'>{explanation}</p>
          <div className='flex flex-wrap gap-2'>
            <Button
              data-confirm-action
              className='h-auto min-h-10 whitespace-normal break-words text-left'
              variant='destructive'
              disabled={pending}
              onClick={async () => {
                setPending(true);
                setError('');
                try {
                  await onConfirm();
                  setDone(true);
                } catch {
                  setError(
                    'Unable to complete this Group action. Your access or this person’s status may have changed. Please try again.'
                  );
                } finally {
                  setPending(false);
                }
              }}
            >
              {pending ? 'Saving…' : confirmation}
            </Button>
            <Button
              variant='outline'
              disabled={pending}
              onClick={() => {
                restoreFocus.current = true;
                setConfirming(false);
                setError('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          data-trigger-action
          className='h-auto min-h-10 whitespace-normal break-words text-left'
          variant='outline'
          onClick={() => setConfirming(true)}
        >
          {label}
        </Button>
      )}
      {error && (
        <p role='alert' className='text-destructive'>
          {error}
        </p>
      )}
    </div>
  );
}
