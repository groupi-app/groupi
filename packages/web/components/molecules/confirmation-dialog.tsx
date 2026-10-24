'use client';

import * as React from 'react';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PaperDivider } from '@/components/atoms/paper-divider';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface ConfirmationDialogProps {
  presentation?: 'soft';
  /**
   * Dialog title displayed in the header
   */
  title: string;
  /**
   * Description text explaining the action
   */
  description: string;
  /**
   * Text for the cancel button
   * @default "Cancel"
   */
  cancelText?: string;
  /**
   * Text for the confirm button
   * @default "Confirm"
   */
  confirmText?: string;
  /**
   * Whether the confirm action is destructive (shows red button)
   * @default true
   */
  isDestructive?: boolean;
  /**
   * Whether the dialog is in a loading state
   * @default false
   */
  isLoading?: boolean;
  /**
   * Text to show while loading
   * @default "Processing..."
   */
  loadingText?: string;
  /**
   * Resolve after success to close; throw on failure to keep the action retryable.
   */
  onConfirm: () => void | Promise<void>;
  /**
   * Additional class names for the dialog content
   */
  className?: string;
  /**
   * Custom icon to display in the header
   */
  icon?: React.ReactNode;
  /**
   * Variant for the confirm button
   * @default "destructive" if isDestructive, "default" otherwise
   */
  confirmVariant?: ButtonProps['variant'];
}

export function ConfirmationDialog({
  title,
  presentation,
  description,
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  isDestructive = true,
  isLoading = false,
  loadingText = 'Processing...',
  onConfirm,
  className,
  icon,
  confirmVariant,
}: ConfirmationDialogProps) {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState('');
  const processing = React.useRef(false);
  const close = React.useRef<HTMLButtonElement>(null);

  const handleConfirm = async () => {
    if (processing.current || isLoading) return;
    processing.current = true;
    setIsProcessing(true);
    setError('');
    try {
      await onConfirm();
      close.current?.click();
    } catch {
      setError('Unable to complete this action. Please try again.');
    } finally {
      processing.current = false;
      setIsProcessing(false);
    }
  };

  const loading = isLoading || isProcessing;
  const variant = confirmVariant ?? (isDestructive ? 'destructive' : 'default');

  return (
    <DialogContent
      presentation={presentation}
      className={cn(className)}
      preventClose={loading}
    >
      <DialogHeader>
        {icon && <div className='flex justify-center mb-2'>{icon}</div>}
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <DialogClose ref={close} className='hidden' aria-hidden tabIndex={-1} />
      {presentation === 'soft' && <PaperDivider treatment='perforated' />}
      <DialogFooter>
        <div className='flex items-center gap-2'>
          <DialogClose asChild>
            <Button
              presentation={presentation}
              variant='ghost'
              disabled={loading}
              className='flex-1'
            >
              {cancelText}
            </Button>
          </DialogClose>
          <Button
            presentation={presentation}
            onClick={handleConfirm}
            disabled={loading}
            variant={variant}
            className='flex-1'
          >
            {loading ? loadingText : confirmText}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
