'use client';

import { useState, useRef, useCallback } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  useFileUpload,
  ALLOWED_MIME_TYPES,
} from '@/hooks/convex/use-file-upload';
import { Id } from '@/convex/_generated/dataModel';

interface EventImageUploadProps {
  imageUrl?: string | null;
  imageStorageId?: Id<'_storage'> | null;
  onImageChange: (storageId: Id<'_storage'> | null) => void;
  disabled?: boolean;
}

export function EventImageUpload({
  imageUrl,
  onImageChange,
  disabled = false,
}: EventImageUploadProps) {
  const { uploadFile, isUploading } = useFileUpload();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!ALLOWED_MIME_TYPES.IMAGE.includes(file.type)) {
        return;
      }

      // Create preview immediately
      const reader = new FileReader();
      reader.onload = e => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file
      const result = await uploadFile(file);
      if (result) {
        onImageChange(result.storageId);
      } else {
        // Upload failed, clear preview
        setPreviewUrl(null);
      }
    },
    [uploadFile, onImageChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
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

      const file = e.dataTransfer.files?.[0];
      if (file && ALLOWED_MIME_TYPES.IMAGE.includes(file.type)) {
        handleFileSelect(file);
      }
    },
    [disabled, handleFileSelect]
  );

  const handleRemove = useCallback(() => {
    setPreviewUrl(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onImageChange]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const displayUrl = previewUrl || imageUrl;

  return (
    <div className='space-y-2'>
      <input
        ref={fileInputRef}
        type='file'
        accept={ALLOWED_MIME_TYPES.IMAGE.join(',')}
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className='hidden'
      />

      {displayUrl ? (
        <div className='relative group'>
          <div className='relative aspect-video w-full max-w-md overflow-hidden rounded-lg border'>
            <img
              src={displayUrl}
              alt='Event cover image preview'
              className='w-full h-full object-cover'
            />
            {isUploading && (
              <div className='absolute inset-0 bg-background/80 flex items-center justify-center'>
                <Icons.spinner className='size-8 animate-spin' />
              </div>
            )}
          </div>
          <Button
            type='button'
            variant='destructive'
            size='sm'
            className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity'
            onClick={handleRemove}
            disabled={disabled || isUploading}
          >
            <Icons.x className='size-4 mr-1' />
            Remove
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
          {isUploading ? (
            <>
              <Icons.spinner className='size-8 animate-spin text-muted-foreground' />
              <p className='text-sm text-muted-foreground'>Uploading...</p>
            </>
          ) : (
            <>
              <Icons.image className='size-10 text-muted-foreground' />
              <div className='text-center'>
                <p className='text-sm font-medium'>Add a cover image</p>
                <p className='text-xs text-muted-foreground'>
                  Drag and drop or click to upload
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
