'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ALLOWED_MIME_TYPES } from '@/hooks/convex/use-file-upload';

interface AttachmentButtonProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  remainingSlots?: number;
  className?: string;
  /** Optional label text to display next to the button - makes entire area clickable */
  label?: string;
}

/**
 * A button for adding file attachments
 * Displays a + icon that opens a file picker
 * Optionally shows a label that is also part of the clickable area
 */
export function AttachmentButton({
  onFilesSelected,
  disabled = false,
  remainingSlots = 10,
  className,
  label,
}: AttachmentButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Build accept string from allowed MIME types
  const acceptTypes = Object.values(ALLOWED_MIME_TYPES).flat().join(',');

  const isDisabled = disabled || remainingSlots <= 0;

  // If label is provided, render button with label as a single clickable element
  if (label) {
    return (
      <>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              onClick={handleClick}
              disabled={isDisabled}
              className={cn('h-8 gap-2 px-2', className)}
              aria-label='Add attachment'
            >
              <Icons.plus className='h-4 w-4' />
              <span className='text-sm text-muted-foreground'>{label}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side='top'>
            {isDisabled
              ? 'Maximum attachments reached'
              : `Add attachment (${remainingSlots} remaining)`}
          </TooltipContent>
        </Tooltip>
        <input
          ref={inputRef}
          type='file'
          multiple
          accept={acceptTypes}
          onChange={handleChange}
          className='hidden'
          aria-hidden='true'
        />
      </>
    );
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            onClick={handleClick}
            disabled={isDisabled}
            className={cn('h-8 w-8', className)}
            aria-label='Add attachment'
          >
            <Icons.plus className='h-4 w-4' />
          </Button>
        </TooltipTrigger>
        <TooltipContent side='top'>
          {isDisabled
            ? 'Maximum attachments reached'
            : `Add attachment (${remainingSlots} remaining)`}
        </TooltipContent>
      </Tooltip>
      <input
        ref={inputRef}
        type='file'
        multiple
        accept={acceptTypes}
        onChange={handleChange}
        className='hidden'
        aria-hidden='true'
      />
    </>
  );
}
