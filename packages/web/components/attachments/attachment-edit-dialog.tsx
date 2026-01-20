'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { PendingUpload } from '@/hooks/convex/use-file-upload';

interface AttachmentEditDialogProps {
  upload: PendingUpload | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: {
    displayFilename: string;
    altText?: string;
    isSpoiler: boolean;
  }) => void;
}

/**
 * Discord-style dialog for editing attachment metadata
 * - Filename
 * - Alt text / description (for images)
 * - Spoiler toggle
 */
export function AttachmentEditDialog({
  upload,
  open,
  onOpenChange,
  onSave,
}: AttachmentEditDialogProps) {
  // Render inner form only when dialog is open and upload exists
  // This ensures form state is fresh each time the dialog opens
  if (!open || !upload) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AttachmentEditForm
        upload={upload}
        onSave={onSave}
        onCancel={() => onOpenChange(false)}
      />
    </Dialog>
  );
}

/**
 * Inner form component that initializes state from upload prop
 * Remounts when dialog opens with new upload, resetting form state
 */
function AttachmentEditForm({
  upload,
  onSave,
  onCancel,
}: {
  upload: PendingUpload;
  onSave: AttachmentEditDialogProps['onSave'];
  onCancel: () => void;
}) {
  // Initialize state directly from props - component remounts when dialog opens
  const [filename, setFilename] = useState(upload.displayFilename);
  const [altText, setAltText] = useState(upload.altText || '');
  const [isSpoiler, setIsSpoiler] = useState(upload.isSpoiler);

  const handleSave = () => {
    onSave({
      displayFilename: filename.trim() || upload.file.name || 'file',
      altText: altText.trim() || undefined,
      isSpoiler,
    });
    onCancel();
  };

  const isImage = upload.file.type.startsWith('image/');

  return (
    <DialogContent className='sm:max-w-md'>
      <DialogHeader>
        <DialogTitle>Modify Attachment</DialogTitle>
      </DialogHeader>

      <div className='space-y-4'>
        {/* Image Preview */}
        {upload.preview && (
          <div className='relative w-32 h-32 rounded-md overflow-hidden bg-muted'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={upload.preview}
              alt={upload.displayFilename}
              className={cn(
                'w-full h-full object-cover',
                isSpoiler && 'blur-xl'
              )}
            />
            {isSpoiler && (
              <div className='absolute inset-0 flex items-center justify-center'>
                <span className='bg-black/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full'>
                  SPOILER
                </span>
              </div>
            )}
          </div>
        )}

        {/* Non-image file icon */}
        {!upload.preview && (
          <div className='flex items-center gap-2 p-3 rounded-md bg-muted'>
            <FileIcon
              mimeType={upload.file.type}
              className='h-8 w-8 text-muted-foreground'
            />
            <span className='text-sm truncate'>{upload.displayFilename}</span>
          </div>
        )}

        {/* Filename */}
        <div className='space-y-2'>
          <Label htmlFor='filename'>Filename</Label>
          <Input
            id='filename'
            value={filename}
            onChange={e => setFilename(e.target.value)}
            placeholder='Enter filename'
            className='bg-muted'
          />
        </div>

        {/* Alt Text (for images only) */}
        {isImage && (
          <div className='space-y-2'>
            <Label htmlFor='altText'>Description (Alt Text)</Label>
            <Input
              id='altText'
              value={altText}
              onChange={e => setAltText(e.target.value)}
              placeholder='Add a description'
              className='bg-muted'
            />
          </div>
        )}

        {/* Spoiler Toggle */}
        <div className='flex items-center gap-3'>
          <Checkbox
            id='spoiler'
            checked={isSpoiler}
            onCheckedChange={checked => setIsSpoiler(checked === true)}
          />
          <Label htmlFor='spoiler' className='cursor-pointer'>
            Mark as spoiler
          </Label>
        </div>

        {/* Actions */}
        <div className='flex gap-2 pt-2'>
          <Button variant='outline' onClick={onCancel} className='flex-1'>
            Cancel
          </Button>
          <Button onClick={handleSave} className='flex-1'>
            Save
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

/**
 * Get the appropriate icon for a file type
 */
function FileIcon({
  mimeType,
  className,
}: {
  mimeType: string;
  className?: string;
}) {
  if (mimeType.startsWith('video/')) {
    return <Icons.fileVideo className={className} />;
  }
  if (mimeType.startsWith('audio/')) {
    return <Icons.fileAudio className={className} />;
  }
  return <Icons.file className={className} />;
}
