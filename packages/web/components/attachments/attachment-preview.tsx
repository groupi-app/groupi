'use client';

import { useState, useCallback } from 'react';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { PreviewAttachment } from './types';
import { AttachmentEditDialog } from './attachment-edit-dialog';
import { useMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { VisuallyHidden } from '@/components/ui/visually-hidden';

interface AttachmentPreviewProps {
  items: PreviewAttachment[];
  onRemove: (id: string) => void;
  onToggleSpoiler: (id: string) => void;
  onUpdate: (
    id: string,
    updates: {
      displayFilename?: string;
      altText?: string;
      isSpoiler?: boolean;
    }
  ) => void;
  className?: string;
}

export function AttachmentPreview({
  items,
  onRemove,
  onToggleSpoiler,
  onUpdate,
  className,
}: AttachmentPreviewProps) {
  const isMobile = useMobile();
  const [editingItem, setEditingItem] = useState<PreviewAttachment | null>(
    null
  );
  const [lightboxItem, setLightboxItem] = useState<PreviewAttachment | null>(
    null
  );
  const [drawerItem, setDrawerItem] = useState<PreviewAttachment | null>(null);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(
    new Set()
  );

  const handleImageClick = useCallback(
    (item: PreviewAttachment) => {
      if (isMobile) {
        setDrawerItem(item);
        return;
      }
      if (item.isSpoiler && !revealedSpoilers.has(item.id)) {
        setRevealedSpoilers(prev => new Set(prev).add(item.id));
        return;
      }
      setLightboxItem(item);
    },
    [revealedSpoilers, isMobile]
  );

  if (items.length === 0) return null;

  const images = items.filter(u => u.mimeType.startsWith('image/'));
  const videos = items.filter(u => u.mimeType.startsWith('video/'));
  const audio = items.filter(u => u.mimeType.startsWith('audio/'));
  const otherFiles = items.filter(
    u =>
      !u.mimeType.startsWith('image/') &&
      !u.mimeType.startsWith('video/') &&
      !u.mimeType.startsWith('audio/')
  );

  const handleEditSave = (updates: {
    displayFilename: string;
    altText?: string;
    isSpoiler: boolean;
  }) => {
    if (editingItem) {
      onUpdate(editingItem.id, updates);
    }
  };

  if (isMobile) {
    return (
      <>
        <div className={cn('flex flex-wrap gap-2', className)}>
          {images.map(item => (
            <div key={item.id} className='relative'>
              <button
                type='button'
                onClick={() => handleImageClick(item)}
                className={cn(
                  'size-16 rounded-lg overflow-hidden bg-muted',
                  'focus:outline-none focus:ring-2 focus:ring-primary'
                )}
              >
                {item.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.preview}
                    alt={item.filename}
                    className={cn(
                      'w-full h-full object-cover',
                      item.isSpoiler && 'blur-lg scale-110'
                    )}
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center'>
                    <Icons.image className='h-5 w-5 text-muted-foreground' />
                  </div>
                )}
                {item.isSpoiler && (
                  <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                    <span className='bg-black/80 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded'>
                      SPOILER
                    </span>
                  </div>
                )}
                {item.status === 'uploading' && (
                  <div className='absolute inset-0 bg-background/60 flex items-center justify-center'>
                    <Icons.spinner className='h-4 w-4 animate-spin text-primary' />
                  </div>
                )}
              </button>
              <button
                type='button'
                onClick={e => {
                  e.stopPropagation();
                  onRemove(item.id);
                }}
                className={cn(
                  'absolute -top-1.5 -right-1.5 size-6 rounded-full',
                  'bg-background border border-border shadow-raised',
                  'flex items-center justify-center',
                  'hover:bg-muted transition-colors'
                )}
                aria-label={`Remove ${item.filename}`}
              >
                <Icons.close className='h-3.5 w-3.5' />
              </button>
            </div>
          ))}

          {videos.map(item => (
            <div key={item.id} className='relative'>
              <button
                type='button'
                onClick={() => setDrawerItem(item)}
                className={cn(
                  'size-16 rounded-lg overflow-hidden bg-muted border border-border',
                  'flex flex-col items-center justify-center gap-1',
                  'focus:outline-none focus:ring-2 focus:ring-primary'
                )}
              >
                {item.preview ? (
                  <video
                    src={item.preview}
                    className='w-full h-full object-cover'
                    muted
                  />
                ) : (
                  <Icons.fileVideo className='h-5 w-5 text-muted-foreground' />
                )}
                {item.status === 'uploading' && (
                  <div className='absolute inset-0 bg-background/60 flex items-center justify-center'>
                    <Icons.spinner className='h-4 w-4 animate-spin text-primary' />
                  </div>
                )}
                <div className='absolute bottom-0.5 right-0.5 p-0.5 rounded bg-black/70'>
                  <Icons.fileVideo className='h-3 w-3 text-white' />
                </div>
              </button>
              <button
                type='button'
                onClick={e => {
                  e.stopPropagation();
                  onRemove(item.id);
                }}
                className={cn(
                  'absolute -top-1.5 -right-1.5 size-6 rounded-full',
                  'bg-background border border-border shadow-raised',
                  'flex items-center justify-center',
                  'hover:bg-muted transition-colors'
                )}
                aria-label={`Remove ${item.filename}`}
              >
                <Icons.close className='h-3.5 w-3.5' />
              </button>
            </div>
          ))}

          {audio.map(item => (
            <div key={item.id} className='relative'>
              <button
                type='button'
                onClick={() => setDrawerItem(item)}
                className={cn(
                  'size-16 rounded-lg overflow-hidden bg-muted border border-border',
                  'flex flex-col items-center justify-center gap-1',
                  'focus:outline-none focus:ring-2 focus:ring-primary'
                )}
              >
                <Icons.fileAudio className='h-5 w-5 text-muted-foreground' />
                <span className='text-[10px] text-muted-foreground px-1 truncate max-w-full'>
                  {item.filename.split('.').pop()?.toUpperCase()}
                </span>
                {item.status === 'uploading' && (
                  <div className='absolute inset-0 bg-background/60 flex items-center justify-center'>
                    <Icons.spinner className='h-4 w-4 animate-spin text-primary' />
                  </div>
                )}
              </button>
              <button
                type='button'
                onClick={e => {
                  e.stopPropagation();
                  onRemove(item.id);
                }}
                className={cn(
                  'absolute -top-1.5 -right-1.5 size-6 rounded-full',
                  'bg-background border border-border shadow-raised',
                  'flex items-center justify-center',
                  'hover:bg-muted transition-colors'
                )}
                aria-label={`Remove ${item.filename}`}
              >
                <Icons.close className='h-3.5 w-3.5' />
              </button>
            </div>
          ))}

          {otherFiles.map(item => (
            <div key={item.id} className='relative'>
              <button
                type='button'
                onClick={() => setDrawerItem(item)}
                className={cn(
                  'size-16 rounded-lg overflow-hidden bg-muted border border-border',
                  'flex flex-col items-center justify-center gap-1',
                  'focus:outline-none focus:ring-2 focus:ring-primary'
                )}
              >
                <FileIcon
                  mimeType={item.mimeType}
                  className='h-5 w-5 text-muted-foreground'
                />
                <span className='text-[10px] text-muted-foreground px-1 truncate max-w-full'>
                  {item.filename.split('.').pop()?.toUpperCase()}
                </span>
                {item.status === 'uploading' && (
                  <div className='absolute inset-0 bg-background/60 flex items-center justify-center'>
                    <Icons.spinner className='h-4 w-4 animate-spin text-primary' />
                  </div>
                )}
              </button>
              <button
                type='button'
                onClick={e => {
                  e.stopPropagation();
                  onRemove(item.id);
                }}
                className={cn(
                  'absolute -top-1.5 -right-1.5 size-6 rounded-full',
                  'bg-background border border-border shadow-raised',
                  'flex items-center justify-center',
                  'hover:bg-muted transition-colors'
                )}
                aria-label={`Remove ${item.filename}`}
              >
                <Icons.close className='h-3.5 w-3.5' />
              </button>
            </div>
          ))}
        </div>

        <Drawer
          open={!!drawerItem}
          onOpenChange={open => !open && setDrawerItem(null)}
        >
          <DrawerContent>
            <DrawerHeader className='text-left'>
              <DrawerTitle className='truncate'>
                {drawerItem?.filename}
              </DrawerTitle>
            </DrawerHeader>

            {drawerItem &&
              (() => {
                const currentItem =
                  items.find(u => u.id === drawerItem.id) || drawerItem;
                return (
                  <div className='px-4 pb-4 space-y-4'>
                    {currentItem.mimeType.startsWith('image/') &&
                      currentItem.preview && (
                        <div className='flex justify-center'>
                          <div className='relative rounded-lg overflow-hidden bg-muted max-h-64'>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={currentItem.preview}
                              alt={currentItem.altText || currentItem.filename}
                              className={cn(
                                'max-h-64 w-auto object-contain',
                                currentItem.isSpoiler &&
                                  !revealedSpoilers.has(currentItem.id) &&
                                  'blur-xl'
                              )}
                            />
                            {currentItem.isSpoiler &&
                              !revealedSpoilers.has(currentItem.id) && (
                                <button
                                  type='button'
                                  onClick={() =>
                                    setRevealedSpoilers(prev =>
                                      new Set(prev).add(currentItem.id)
                                    )
                                  }
                                  className='absolute inset-0 flex items-center justify-center bg-black/20'
                                >
                                  <span className='bg-black/80 text-white text-sm font-semibold px-4 py-2 rounded-full'>
                                    Tap to reveal
                                  </span>
                                </button>
                              )}
                          </div>
                        </div>
                      )}

                    {currentItem.mimeType.startsWith('video/') && (
                      <div className='space-y-2'>
                        {currentItem.preview ? (
                          <video
                            src={currentItem.preview}
                            controls
                            className='w-full max-h-48 rounded-lg'
                            preload='metadata'
                          >
                            Your browser does not support video playback.
                          </video>
                        ) : (
                          <div className='flex items-center justify-center h-32 rounded-lg bg-muted'>
                            <Icons.fileVideo className='h-8 w-8 text-muted-foreground' />
                          </div>
                        )}
                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                          <Icons.fileVideo className='h-4 w-4' />
                          <span className='truncate flex-1'>
                            {currentItem.filename}
                          </span>
                          <span className='text-xs'>
                            ({formatFileSize(currentItem.size)})
                          </span>
                        </div>
                      </div>
                    )}

                    {currentItem.mimeType.startsWith('audio/') && (
                      <div className='space-y-2'>
                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                          <Icons.fileAudio className='h-4 w-4' />
                          <span className='truncate flex-1'>
                            {currentItem.filename}
                          </span>
                          <span className='text-xs'>
                            ({formatFileSize(currentItem.size)})
                          </span>
                        </div>
                        {currentItem.preview ? (
                          <audio
                            src={currentItem.preview}
                            controls
                            className='w-full'
                          >
                            Your browser does not support audio playback.
                          </audio>
                        ) : (
                          <div className='text-sm text-muted-foreground p-4 rounded-lg bg-muted text-center'>
                            Audio preview unavailable
                          </div>
                        )}
                      </div>
                    )}

                    {!currentItem.mimeType.startsWith('image/') &&
                      !currentItem.mimeType.startsWith('video/') &&
                      !currentItem.mimeType.startsWith('audio/') && (
                        <div className='flex items-center gap-3 p-4 rounded-lg bg-muted'>
                          <FileIcon
                            mimeType={currentItem.mimeType}
                            className='h-8 w-8 text-muted-foreground'
                          />
                          <div className='flex-1 min-w-0'>
                            <p className='font-medium truncate'>
                              {currentItem.filename}
                            </p>
                            <p className='text-sm text-muted-foreground'>
                              {formatFileSize(currentItem.size)}
                            </p>
                          </div>
                        </div>
                      )}

                    <div className='rounded-lg border border-border divide-y divide-border'>
                      {currentItem.mimeType.startsWith('image/') && (
                        <button
                          type='button'
                          onClick={() => {
                            setDrawerItem(null);
                            setEditingItem(currentItem);
                          }}
                          className='w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors'
                        >
                          <Icons.image className='h-5 w-5 text-muted-foreground' />
                          <span className='flex-1 text-left'>
                            Image Description
                          </span>
                          <Icons.forward className='h-4 w-4 text-muted-foreground' />
                        </button>
                      )}

                      {!currentItem.mimeType.startsWith('image/') && (
                        <button
                          type='button'
                          onClick={() => {
                            setDrawerItem(null);
                            setEditingItem(currentItem);
                          }}
                          className='w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors'
                        >
                          <Icons.edit className='h-5 w-5 text-muted-foreground' />
                          <span className='flex-1 text-left'>Rename</span>
                          <Icons.forward className='h-4 w-4 text-muted-foreground' />
                        </button>
                      )}

                      {currentItem.mimeType.startsWith('image/') && (
                        <div
                          role='button'
                          tabIndex={0}
                          onClick={() => onToggleSpoiler(currentItem.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onToggleSpoiler(currentItem.id);
                            }
                          }}
                          className='w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors cursor-pointer'
                        >
                          <Icons.spoiler className='h-5 w-5 text-muted-foreground' />
                          <span className='flex-1 text-left'>
                            Mark as spoiler
                          </span>
                          <Checkbox
                            checked={currentItem.isSpoiler}
                            onCheckedChange={() =>
                              onToggleSpoiler(currentItem.id)
                            }
                            className='pointer-events-none'
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

            <DrawerFooter>
              <Button
                variant='destructive'
                onClick={() => {
                  if (drawerItem) {
                    onRemove(drawerItem.id);
                    setDrawerItem(null);
                  }
                }}
                className='w-full'
              >
                <Icons.delete className='h-4 w-4 mr-2' />
                Remove file
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        <AttachmentEditDialog
          item={editingItem}
          open={!!editingItem}
          onOpenChange={open => !open && setEditingItem(null)}
          onSave={handleEditSave}
        />
      </>
    );
  }

  return (
    <>
      <div className={cn('space-y-3', className)}>
        {images.length > 0 && (
          <div className='flex flex-wrap gap-2'>
            {images.map(item => {
              const isRevealed = revealedSpoilers.has(item.id);
              const showSpoilerOverlay = item.isSpoiler && !isRevealed;

              return (
                <div
                  key={item.id}
                  className='relative group rounded-lg overflow-hidden bg-muted size-24'
                >
                  <button
                    type='button'
                    onClick={() => handleImageClick(item)}
                    className='w-full h-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                  >
                    {item.preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.preview}
                        alt={item.filename}
                        className={cn(
                          'w-full h-full object-cover transition-all',
                          showSpoilerOverlay && 'blur-xl scale-110',
                          !showSpoilerOverlay && 'group-hover:scale-105'
                        )}
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center'>
                        <Icons.image className='h-6 w-6 text-muted-foreground' />
                      </div>
                    )}
                  </button>

                  {showSpoilerOverlay && (
                    <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                      <span className='bg-black/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full'>
                        SPOILER
                      </span>
                    </div>
                  )}

                  {item.status === 'uploading' && (
                    <div className='absolute inset-0 bg-background/60 flex items-center justify-center pointer-events-none'>
                      <Icons.spinner className='h-5 w-5 animate-spin text-primary' />
                    </div>
                  )}

                  {item.status === 'error' && (
                    <div className='absolute inset-0 bg-destructive/20 flex items-center justify-center pointer-events-none'>
                      <Icons.warning className='h-5 w-5 text-destructive' />
                    </div>
                  )}

                  <div className='absolute top-1 right-1 flex gap-1'>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type='button'
                          onClick={e => {
                            e.stopPropagation();
                            onToggleSpoiler(item.id);
                          }}
                          className={cn(
                            'p-1.5 rounded-md',
                            'bg-black/70 hover:bg-black/90 text-white',
                            'transition-colors',
                            'focus:outline-none focus:ring-1 focus:ring-white'
                          )}
                          aria-label={
                            item.isSpoiler
                              ? 'Remove spoiler'
                              : 'Mark as spoiler'
                          }
                        >
                          {item.isSpoiler ? (
                            <Icons.spoilerOff className='h-4 w-4' />
                          ) : (
                            <Icons.spoiler className='h-4 w-4' />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side='bottom'>
                        {item.isSpoiler ? 'Remove spoiler' : 'Mark as spoiler'}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type='button'
                          onClick={e => {
                            e.stopPropagation();
                            setEditingItem(item);
                          }}
                          className={cn(
                            'p-1.5 rounded-md',
                            'bg-black/70 hover:bg-black/90 text-white',
                            'transition-colors',
                            'focus:outline-none focus:ring-1 focus:ring-white'
                          )}
                          aria-label={`Edit ${item.filename}`}
                        >
                          <Icons.edit className='h-4 w-4' />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side='bottom'>
                        Edit attachment
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type='button'
                          onClick={e => {
                            e.stopPropagation();
                            onRemove(item.id);
                          }}
                          className={cn(
                            'p-1.5 rounded-md',
                            'bg-black/70 hover:bg-destructive text-white',
                            'transition-colors',
                            'focus:outline-none focus:ring-1 focus:ring-white'
                          )}
                          aria-label={`Remove ${item.filename}`}
                        >
                          <Icons.delete className='h-4 w-4' />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side='bottom'>Remove</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {videos.length > 0 && (
          <div className='space-y-2'>
            {videos.map(item => (
              <div
                key={item.id}
                className='relative group rounded-md overflow-hidden bg-muted max-w-md'
              >
                {item.preview ? (
                  <video
                    src={item.preview}
                    controls
                    className='w-full max-h-48'
                    preload='metadata'
                  >
                    Your browser does not support video playback.
                  </video>
                ) : (
                  <div className='flex items-center justify-center h-32 bg-muted'>
                    <Icons.fileVideo className='h-8 w-8 text-muted-foreground' />
                  </div>
                )}
                <div className='px-3 py-2 text-sm text-muted-foreground flex items-center gap-2'>
                  <Icons.fileVideo className='h-4 w-4' />
                  <span className='truncate flex-1'>{item.filename}</span>
                  <span className='text-xs'>({formatFileSize(item.size)})</span>
                  {item.status === 'uploading' && (
                    <Icons.spinner className='h-3.5 w-3.5 animate-spin' />
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type='button'
                        onClick={() => setEditingItem(item)}
                        className='p-1 rounded hover:bg-accent/80 transition-colors focus:outline-none'
                        aria-label={`Edit ${item.filename}`}
                      >
                        <Icons.edit className='h-3.5 w-3.5' />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side='bottom'>
                      Edit attachment
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type='button'
                        onClick={() => onRemove(item.id)}
                        className='p-1 rounded hover:bg-destructive/80 hover:text-destructive-foreground transition-colors focus:outline-none'
                        aria-label={`Remove ${item.filename}`}
                      >
                        <Icons.delete className='h-3.5 w-3.5' />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side='bottom'>Remove</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}

        {audio.length > 0 && (
          <div className='space-y-2'>
            {audio.map(item => (
              <div
                key={item.id}
                className='relative group rounded-md bg-muted p-3 max-w-md'
              >
                <div className='flex items-center gap-2 mb-2 text-sm text-muted-foreground'>
                  <Icons.fileAudio className='h-4 w-4' />
                  <span className='truncate flex-1'>{item.filename}</span>
                  <span className='text-xs'>({formatFileSize(item.size)})</span>
                  {item.status === 'uploading' && (
                    <Icons.spinner className='h-3.5 w-3.5 animate-spin' />
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type='button'
                        onClick={() => setEditingItem(item)}
                        className='p-1 rounded hover:bg-accent/80 transition-colors focus:outline-none'
                        aria-label={`Edit ${item.filename}`}
                      >
                        <Icons.edit className='h-3.5 w-3.5' />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side='bottom'>
                      Edit attachment
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type='button'
                        onClick={() => onRemove(item.id)}
                        className='p-1 rounded hover:bg-destructive/80 hover:text-destructive-foreground transition-colors focus:outline-none'
                        aria-label={`Remove ${item.filename}`}
                      >
                        <Icons.delete className='h-3.5 w-3.5' />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side='bottom'>Remove</TooltipContent>
                  </Tooltip>
                </div>
                {item.preview ? (
                  <audio src={item.preview} controls className='w-full'>
                    Your browser does not support audio playback.
                  </audio>
                ) : (
                  <div className='text-sm text-muted-foreground'>
                    Audio preview unavailable
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {otherFiles.length > 0 && (
          <div className='flex flex-wrap gap-2'>
            {otherFiles.map(item => (
              <div
                key={item.id}
                className={cn(
                  'group flex items-center gap-2 px-3 py-2 rounded-md',
                  'bg-muted border border-border',
                  'text-sm'
                )}
              >
                <FileIcon
                  mimeType={item.mimeType}
                  className='h-4 w-4 text-muted-foreground flex-shrink-0'
                />
                <span className='max-w-[120px] truncate'>{item.filename}</span>

                {item.status === 'uploading' && (
                  <Icons.spinner className='h-3.5 w-3.5 animate-spin flex-shrink-0' />
                )}

                {item.status === 'error' && (
                  <Icons.warning className='h-3.5 w-3.5 text-destructive flex-shrink-0' />
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type='button'
                      onClick={() => setEditingItem(item)}
                      className={cn(
                        'p-1 rounded hover:bg-accent/80 flex-shrink-0',
                        'transition-colors',
                        'focus:outline-none'
                      )}
                      aria-label={`Edit ${item.filename}`}
                    >
                      <Icons.edit className='h-3.5 w-3.5' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='bottom'>Edit attachment</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type='button'
                      onClick={() => onRemove(item.id)}
                      className={cn(
                        'p-1 rounded hover:bg-destructive/80 hover:text-destructive-foreground flex-shrink-0',
                        'transition-colors',
                        'focus:outline-none'
                      )}
                      aria-label={`Remove ${item.filename}`}
                    >
                      <Icons.delete className='h-3.5 w-3.5' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='bottom'>Remove</TooltipContent>
                </Tooltip>
              </div>
            ))}
          </div>
        )}
      </div>

      <AttachmentEditDialog
        item={editingItem}
        open={!!editingItem}
        onOpenChange={open => !open && setEditingItem(null)}
        onSave={handleEditSave}
      />

      <Dialog open={!!lightboxItem} onOpenChange={() => setLightboxItem(null)}>
        <DialogContent className='max-w-4xl max-h-[90vh] p-0 overflow-hidden'>
          <VisuallyHidden>
            <DialogTitle>{lightboxItem?.filename || 'Image'}</DialogTitle>
          </VisuallyHidden>
          {lightboxItem?.preview && (
            <div className='relative'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxItem.preview}
                alt={lightboxItem.altText || lightboxItem.filename}
                className='w-full h-auto max-h-[85vh] object-contain'
              />
              <div className='absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent'>
                <div className='flex items-center justify-between text-white'>
                  <div className='flex-1 min-w-0'>
                    <span className='text-sm truncate block'>
                      {lightboxItem.filename}
                    </span>
                    {lightboxItem.altText && (
                      <span className='text-xs text-white/70 truncate block'>
                        {lightboxItem.altText}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
