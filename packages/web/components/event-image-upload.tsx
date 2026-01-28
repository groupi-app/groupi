'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ALLOWED_MIME_TYPES } from '@/hooks/convex/use-file-upload';

interface EventImageUploadProps {
  /** Existing image URL (for edit mode) */
  imageUrl?: string | null;
  /** File object for pending upload */
  file?: File | null;
  /** Called when a file is selected or removed */
  onFileChange: (file: File | null) => void;
  /** Called when an existing image should be removed (edit mode) */
  onRemoveExisting?: () => void;
  disabled?: boolean;
}

// Module-level cache for blob URLs to avoid creating duplicates
const blobUrlCache = new WeakMap<File, string>();

function getOrCreateBlobUrl(file: File | null | undefined): string | null {
  if (!file) return null;

  let url = blobUrlCache.get(file);
  if (!url) {
    url = URL.createObjectURL(file);
    blobUrlCache.set(file, url);
  }
  return url;
}

export function EventImageUpload({
  imageUrl,
  file,
  onFileChange,
  onRemoveExisting,
  disabled = false,
}: EventImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get or create blob URL - useMemo ensures we don't recreate on every render
  // WeakMap cache ensures same File always gets same URL
  // Blob URLs are automatically cleaned up when File is garbage collected
  const blobUrl = useMemo(() => getOrCreateBlobUrl(file), [file]);

  const handleFileSelect = useCallback(
    (selectedFile: File) => {
      if (!ALLOWED_MIME_TYPES.IMAGE.includes(selectedFile.type)) {
        return;
      }
      onFileChange(selectedFile);
    },
    [onFileChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFileSelect(selectedFile);
      }
      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile && ALLOWED_MIME_TYPES.IMAGE.includes(droppedFile.type)) {
        handleFileSelect(droppedFile);
      }
    },
    [disabled, handleFileSelect]
  );

  const handleRemove = useCallback(() => {
    onFileChange(null);
    if (onRemoveExisting) {
      onRemoveExisting();
    }
  }, [onFileChange, onRemoveExisting]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  // Display blob URL (new file) or existing image URL
  const displayUrl = blobUrl || imageUrl;

  return (
    <div className='space-y-2'>
      <input
        ref={fileInputRef}
        type='file'
        accept={ALLOWED_MIME_TYPES.IMAGE.join(',')}
        onChange={handleInputChange}
        disabled={disabled}
        className='hidden'
      />

      {displayUrl ? (
        <div className='flex flex-col gap-2 max-w-md'>
          <div
            onClick={handleClick}
            className={cn(
              'relative aspect-video w-full overflow-hidden rounded-lg border cursor-pointer',
              'hover:opacity-90 transition-opacity',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- Blob URLs for upload preview require native img */}
            <img
              src={displayUrl}
              alt='Event cover image preview'
              className='w-full h-full object-cover'
            />
            <div className='absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors'>
              <div className='opacity-0 hover:opacity-100 transition-opacity'>
                <Icons.image className='size-8 text-white drop-shadow-lg' />
              </div>
            </div>
          </div>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='text-muted-foreground hover:text-destructive w-fit'
            onClick={handleRemove}
            disabled={disabled}
          >
            <Icons.x className='size-4 mr-1' />
            Remove image
          </Button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-3 p-8',
            'border-2 border-dashed rounded-lg cursor-pointer',
            'transition-colors aspect-video max-w-md',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Icons.image className='size-10 text-muted-foreground' />
          <div className='text-center'>
            <p className='text-sm font-medium'>Add a cover image</p>
            <p className='text-xs text-muted-foreground'>
              Drag and drop or click to upload
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
