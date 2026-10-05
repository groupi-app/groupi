'use client';

import { useState } from 'react';
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
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  if (done) return <p role='status'>{label} completed.</p>;
  return (
    <div className='space-y-2'>
      {confirming ? (
        <div
          className='rounded-card border border-border p-3 space-y-2'
          role='group'
          aria-label={confirmation}
        >
          <p className='text-sm'>{explanation}</p>
          <div className='flex flex-wrap gap-2'>
            <Button
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
                setConfirming(false);
                setError('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant='outline' onClick={() => setConfirming(true)}>
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
