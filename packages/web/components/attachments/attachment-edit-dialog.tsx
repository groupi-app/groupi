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
import type { PreviewAttachment } from './types';

interface AttachmentEditDialogProps {
  item: PreviewAttachment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: {
    displayFilename: string;
    altText?: string;
    isSpoiler: boolean;
  }) => void;
}

export function AttachmentEditDialog({
  item,
  open,
  onOpenChange,
  onSave,
}: AttachmentEditDialogProps) {
  if (!open || !item) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AttachmentEditForm
        item={item}
        onSave={onSave}
        onCancel={() => onOpenChange(false)}
      />
    </Dialog>
  );
}

function AttachmentEditForm({
  item,
  onSave,
  onCancel,
}: {
  item: PreviewAttachment;
  onSave: AttachmentEditDialogProps['onSave'];
  onCancel: () => void;
}) {
  const [filename, setFilename] = useState(item.filename);
  const [altText, setAltText] = useState(item.altText || '');
  const [isSpoiler, setIsSpoiler] = useState(item.isSpoiler);

  const handleSave = () => {
    onSave({
      displayFilename: filename.trim() || item.filename || 'file',
      altText: altText.trim() || undefined,
      isSpoiler,
    });
    onCancel();
  };

  const isImage = item.mimeType.startsWith('image/');

  return (
    <DialogContent className='sm:max-w-md'>
      <DialogHeader>
        <DialogTitle>Modify Attachment</DialogTitle>
      </DialogHeader>

      <div className='space-y-4'>
        {item.preview && (
          <div className='relative w-32 h-32 rounded-md overflow-hidden bg-muted'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.preview}
              alt={item.filename}
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

        {!item.preview && (
          <div className='flex items-center gap-2 p-3 rounded-md bg-muted'>
            <FileIcon
              mimeType={item.mimeType}
              className='h-8 w-8 text-muted-foreground'
            />
            <span className='text-sm truncate'>{item.filename}</span>
          </div>
        )}

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
