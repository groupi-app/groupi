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
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ConfirmationDialogProps {
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
   * Callback when the confirm button is clicked
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

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  };

  const loading = isLoading || isProcessing;
  const variant = confirmVariant ?? (isDestructive ? 'destructive' : 'default');

  return (
    <DialogContent className={cn(className)}>
      <DialogHeader>
        {icon && <div className='flex justify-center mb-2'>{icon}</div>}
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <div className='flex items-center gap-2'>
          <DialogClose asChild>
            <Button variant='ghost' disabled={loading} className='flex-1'>
              {cancelText}
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              onClick={handleConfirm}
              disabled={loading}
              variant={variant}
              className='flex-1'
            >
              {loading ? loadingText : confirmText}
            </Button>
          </DialogClose>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
