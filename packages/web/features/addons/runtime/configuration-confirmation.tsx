'use client';

import { useRef, useState, type RefObject } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/** Confirmation resolves only after success or cancellation, retaining editor drafts on failure. */
export function useConfigurationConfirmation(
  fallbackFocus?: RefObject<HTMLElement | null>
) {
  const previousFocus = useRef<HTMLElement | null>(null);
  const [pending, setPending] = useState<{
    title: string;
    description: string;
    perform: () => Promise<void>;
    resolve: (saved: boolean) => void;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  function cancel() {
    if (saving) return;
    pending?.resolve(false);
    setPending(null);
    setError('');
  }
  function confirm(
    title: string,
    description: string,
    perform: () => Promise<void>
  ) {
    previousFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setError('');
    return new Promise<boolean>(resolve =>
      setPending({ title, description, perform, resolve })
    );
  }
  const dialog = (
    <AlertDialog
      open={pending !== null}
      onOpenChange={open => {
        if (!open) cancel();
      }}
    >
      <AlertDialogContent
        onCloseAutoFocus={event => {
          event.preventDefault();
          const target = previousFocus.current;
          (target?.isConnected ? target : fallbackFocus?.current)?.focus();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{pending?.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {pending?.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role='alert' className='text-destructive'>
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <Button variant='outline' disabled={saving} onClick={cancel}>
            Cancel
          </Button>
          <Button
            variant='destructive'
            disabled={saving}
            onClick={async () => {
              if (!pending) return;
              setSaving(true);
              setError('');
              try {
                await pending.perform();
                pending.resolve(true);
                setPending(null);
              } catch {
                setError(
                  'Unable to save this change. Your edits are still here. Try again.'
                );
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? 'Saving…' : 'Confirm change'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  return { confirm, dialog, confirming: pending !== null };
}
