'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EmptyState } from './empty-state';
import { LoadingState } from './loading-state';
import { cn } from '@/lib/utils';

export interface InfoDialogProps {
  /**
   * Dialog title
   */
  title: string;
  /**
   * Optional description below the title
   */
  description?: string;
  /**
   * Whether the dialog is open
   */
  open: boolean;
  /**
   * Callback when open state changes
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Whether the dialog content is loading
   */
  isLoading?: boolean;
  /**
   * Loading message to display
   */
  loadingMessage?: string;
  /**
   * Whether the content is empty
   */
  isEmpty?: boolean;
  /**
   * Message to display when empty
   */
  emptyMessage?: string;
  /**
   * Optional icon for empty state
   */
  emptyIcon?: React.ReactNode;
  /**
   * Close button text
   * @default "Close"
   */
  closeText?: string;
  /**
   * Additional class names for dialog content
   */
  className?: string;
  /**
   * Children to render when not loading and not empty
   */
  children?: React.ReactNode;
}

export function InfoDialog({
  title,
  description,
  open,
  onOpenChange,
  isLoading = false,
  loadingMessage,
  isEmpty = false,
  emptyMessage = 'No items found.',
  emptyIcon,
  closeText = 'Close',
  className,
  children,
}: InfoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'sm:max-w-[600px] max-h-[80vh] overflow-y-auto',
          className
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {isLoading ? (
          <LoadingState message={loadingMessage} />
        ) : isEmpty ? (
          <EmptyState icon={emptyIcon} message={emptyMessage} />
        ) : (
          children
        )}

        <div className='flex justify-end'>
          <Button variant='ghost' onClick={() => onOpenChange(false)}>
            {closeText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
