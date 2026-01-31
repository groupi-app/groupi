'use client';

import { useState, useCallback } from 'react';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { PendingUpload } from '@/hooks/convex/use-file-upload';
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
  uploads: PendingUpload[];
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

/**
 * Shows pending attachments before they are submitted
 * Displays thumbnails for images and icons for other file types
 * Discord-style with spoiler toggle, edit, and delete buttons
 * Responsive: mobile shows small thumbnails with drawer, desktop shows full UI
 */
export function AttachmentPreview({
  uploads,
  onRemove,
  onToggleSpoiler,
  onUpdate,
  className,
}: AttachmentPreviewProps) {
  const isMobile = useMobile();
  const [editingUpload, setEditingUpload] = useState<PendingUpload | null>(
    null
  );
  const [lightboxUpload, setLightboxUpload] = useState<PendingUpload | null>(
    null
  );
  const [drawerUpload, setDrawerUpload] = useState<PendingUpload | null>(null);
  // Track which spoilers have been revealed (click once to reveal, click again to expand)
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(
    new Set()
  );

  const handleImageClick = useCallback(
    (upload: PendingUpload) => {
      if (isMobile) {
        // On mobile, open drawer with options
        setDrawerUpload(upload);
        return;
      }
      // Desktop behavior: reveal spoiler first, then lightbox
      if (upload.isSpoiler && !revealedSpoilers.has(upload.id)) {
        setRevealedSpoilers(prev => new Set(prev).add(upload.id));
        return;
      }
      setLightboxUpload(upload);
    },
    [revealedSpoilers, isMobile]
  );

  if (uploads.length === 0) return null;

  // Separate files by type for different preview rendering
  const images = uploads.filter(u => u.file.type.startsWith('image/'));
  const videos = uploads.filter(u => u.file.type.startsWith('video/'));
  const audio = uploads.filter(u => u.file.type.startsWith('audio/'));
  const otherFiles = uploads.filter(
    u =>
      !u.file.type.startsWith('image/') &&
      !u.file.type.startsWith('video/') &&
      !u.file.type.startsWith('audio/')
  );

  const handleEditSave = (updates: {
    displayFilename: string;
    altText?: string;
    isSpoiler: boolean;
  }) => {
    if (editingUpload) {
      onUpdate(editingUpload.id, updates);
    }
  };

  // Mobile UI - small thumbnails with just X button
  if (isMobile) {
    return (
      <>
        <div className={cn('flex flex-wrap gap-2', className)}>
          {/* Image thumbnails - small with X button */}
          {images.map(upload => (
            <div key={upload.id} className='relative'>
              <button
                type='button'
                onClick={() => handleImageClick(upload)}
                className={cn(
                  'size-16 rounded-lg overflow-hidden bg-muted',
                  'focus:outline-none focus:ring-2 focus:ring-primary'
                )}
              >
                {upload.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={upload.preview}
                    alt={upload.displayFilename}
                    className={cn(
                      'w-full h-full object-cover',
                      upload.isSpoiler && 'blur-lg scale-110'
                    )}
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center'>
                    <Icons.image className='h-5 w-5 text-muted-foreground' />
                  </div>
                )}
                {/* Spoiler indicator */}
                {upload.isSpoiler && (
                  <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                    <span className='bg-black/80 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded'>
                      SPOILER
                    </span>
                  </div>
                )}
                {/* Loading indicator */}
                {upload.status === 'uploading' && (
                  <div className='absolute inset-0 bg-background/60 flex items-center justify-center'>
                    <Icons.spinner className='h-4 w-4 animate-spin text-primary' />
                  </div>
                )}
              </button>
              {/* X button to remove */}
              <button
                type='button'
                onClick={e => {
                  e.stopPropagation();
                  onRemove(upload.id);
                }}
                className={cn(
                  'absolute -top-1.5 -right-1.5 size-6 rounded-full',
                  'bg-background border border-border shadow-raised',
                  'flex items-center justify-center',
                  'hover:bg-muted transition-colors'
                )}
                aria-label={`Remove ${upload.displayFilename}`}
              >
                <Icons.close className='h-3.5 w-3.5' />
              </button>
            </div>
          ))}

          {/* Video thumbnails */}
          {videos.map(upload => (
            <div key={upload.id} className='relative'>
              <button
                type='button'
                onClick={() => setDrawerUpload(upload)}
                className={cn(
                  'size-16 rounded-lg overflow-hidden bg-muted border border-border',
                  'flex flex-col items-center justify-center gap-1',
                  'focus:outline-none focus:ring-2 focus:ring-primary'
                )}
              >
                {upload.preview ? (
                  <video
                    src={upload.preview}
                    className='w-full h-full object-cover'
                    muted
                  />
                ) : (
                  <Icons.fileVideo className='h-5 w-5 text-muted-foreground' />
                )}
                {upload.status === 'uploading' && (
                  <div className='absolute inset-0 bg-background/60 flex items-center justify-center'>
                    <Icons.spinner className='h-4 w-4 animate-spin text-primary' />
                  </div>
                )}
                {/* Video indicator overlay */}
                <div className='absolute bottom-0.5 right-0.5 p-0.5 rounded bg-black/70'>
                  <Icons.fileVideo className='h-3 w-3 text-white' />
                </div>
              </button>
              <button
                type='button'
                onClick={e => {
                  e.stopPropagation();
                  onRemove(upload.id);
                }}
                className={cn(
                  'absolute -top-1.5 -right-1.5 size-6 rounded-full',
                  'bg-background border border-border shadow-raised',
                  'flex items-center justify-center',
                  'hover:bg-muted transition-colors'
                )}
                aria-label={`Remove ${upload.displayFilename}`}
              >
                <Icons.close className='h-3.5 w-3.5' />
              </button>
            </div>
          ))}

          {/* Audio thumbnails */}
          {audio.map(upload => (
            <div key={upload.id} className='relative'>
              <button
                type='button'
                onClick={() => setDrawerUpload(upload)}
                className={cn(
                  'size-16 rounded-lg overflow-hidden bg-muted border border-border',
                  'flex flex-col items-center justify-center gap-1',
                  'focus:outline-none focus:ring-2 focus:ring-primary'
                )}
              >
                <Icons.fileAudio className='h-5 w-5 text-muted-foreground' />
                <span className='text-[10px] text-muted-foreground px-1 truncate max-w-full'>
                  {upload.displayFilename.split('.').pop()?.toUpperCase()}
                </span>
                {upload.status === 'uploading' && (
                  <div className='absolute inset-0 bg-background/60 flex items-center justify-center'>
                    <Icons.spinner className='h-4 w-4 animate-spin text-primary' />
                  </div>
                )}
              </button>
              <button
                type='button'
                onClick={e => {
                  e.stopPropagation();
                  onRemove(upload.id);
                }}
                className={cn(
                  'absolute -top-1.5 -right-1.5 size-6 rounded-full',
                  'bg-background border border-border shadow-raised',
                  'flex items-center justify-center',
                  'hover:bg-muted transition-colors'
                )}
                aria-label={`Remove ${upload.displayFilename}`}
              >
                <Icons.close className='h-3.5 w-3.5' />
              </button>
            </div>
          ))}

          {/* Other file thumbnails */}
          {otherFiles.map(upload => (
            <div key={upload.id} className='relative'>
              <button
                type='button'
                onClick={() => setDrawerUpload(upload)}
                className={cn(
                  'size-16 rounded-lg overflow-hidden bg-muted border border-border',
                  'flex flex-col items-center justify-center gap-1',
                  'focus:outline-none focus:ring-2 focus:ring-primary'
                )}
              >
                <FileIcon
                  mimeType={upload.file.type}
                  className='h-5 w-5 text-muted-foreground'
                />
                <span className='text-[10px] text-muted-foreground px-1 truncate max-w-full'>
                  {upload.displayFilename.split('.').pop()?.toUpperCase()}
                </span>
                {upload.status === 'uploading' && (
                  <div className='absolute inset-0 bg-background/60 flex items-center justify-center'>
                    <Icons.spinner className='h-4 w-4 animate-spin text-primary' />
                  </div>
                )}
              </button>
              {/* X button to remove */}
              <button
                type='button'
                onClick={e => {
                  e.stopPropagation();
                  onRemove(upload.id);
                }}
                className={cn(
                  'absolute -top-1.5 -right-1.5 size-6 rounded-full',
                  'bg-background border border-border shadow-raised',
                  'flex items-center justify-center',
                  'hover:bg-muted transition-colors'
                )}
                aria-label={`Remove ${upload.displayFilename}`}
              >
                <Icons.close className='h-3.5 w-3.5' />
              </button>
            </div>
          ))}
        </div>

        {/* Mobile Drawer */}
        <Drawer
          open={!!drawerUpload}
          onOpenChange={open => !open && setDrawerUpload(null)}
        >
          <DrawerContent>
            <DrawerHeader className='text-left'>
              <DrawerTitle className='truncate'>
                {drawerUpload?.displayFilename}
              </DrawerTitle>
            </DrawerHeader>

            {drawerUpload &&
              (() => {
                // Get the current upload from the uploads array to ensure we have the latest state
                const currentUpload =
                  uploads.find(u => u.id === drawerUpload.id) || drawerUpload;
                return (
                  <div className='px-4 pb-4 space-y-4'>
                    {/* Full image preview */}
                    {currentUpload.file.type.startsWith('image/') &&
                      currentUpload.preview && (
                        <div className='flex justify-center'>
                          <div className='relative rounded-lg overflow-hidden bg-muted max-h-64'>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={currentUpload.preview}
                              alt={
                                currentUpload.altText ||
                                currentUpload.displayFilename
                              }
                              className={cn(
                                'max-h-64 w-auto object-contain',
                                currentUpload.isSpoiler &&
                                  !revealedSpoilers.has(currentUpload.id) &&
                                  'blur-xl'
                              )}
                            />
                            {/* Spoiler overlay in drawer */}
                            {currentUpload.isSpoiler &&
                              !revealedSpoilers.has(currentUpload.id) && (
                                <button
                                  type='button'
                                  onClick={() =>
                                    setRevealedSpoilers(prev =>
                                      new Set(prev).add(currentUpload.id)
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

                    {/* Video preview in drawer */}
                    {currentUpload.file.type.startsWith('video/') && (
                      <div className='space-y-2'>
                        {currentUpload.preview ? (
                          <video
                            src={currentUpload.preview}
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
                            {currentUpload.displayFilename}
                          </span>
                          <span className='text-xs'>
                            ({formatFileSize(currentUpload.file.size)})
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Audio preview in drawer */}
                    {currentUpload.file.type.startsWith('audio/') && (
                      <div className='space-y-2'>
                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                          <Icons.fileAudio className='h-4 w-4' />
                          <span className='truncate flex-1'>
                            {currentUpload.displayFilename}
                          </span>
                          <span className='text-xs'>
                            ({formatFileSize(currentUpload.file.size)})
                          </span>
                        </div>
                        {currentUpload.preview ? (
                          <audio
                            src={currentUpload.preview}
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

                    {/* Other file info (non-image, non-video, non-audio) */}
                    {!currentUpload.file.type.startsWith('image/') &&
                      !currentUpload.file.type.startsWith('video/') &&
                      !currentUpload.file.type.startsWith('audio/') && (
                        <div className='flex items-center gap-3 p-4 rounded-lg bg-muted'>
                          <FileIcon
                            mimeType={currentUpload.file.type}
                            className='h-8 w-8 text-muted-foreground'
                          />
                          <div className='flex-1 min-w-0'>
                            <p className='font-medium truncate'>
                              {currentUpload.displayFilename}
                            </p>
                            <p className='text-sm text-muted-foreground'>
                              {formatFileSize(currentUpload.file.size)}
                            </p>
                          </div>
                        </div>
                      )}

                    {/* Options */}
                    <div className='rounded-lg border border-border divide-y divide-border'>
                      {/* Image Description option */}
                      {currentUpload.file.type.startsWith('image/') && (
                        <button
                          type='button'
                          onClick={() => {
                            setDrawerUpload(null);
                            setEditingUpload(currentUpload);
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

                      {/* Rename option for non-images */}
                      {!currentUpload.file.type.startsWith('image/') && (
                        <button
                          type='button'
                          onClick={() => {
                            setDrawerUpload(null);
                            setEditingUpload(currentUpload);
                          }}
                          className='w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors'
                        >
                          <Icons.edit className='h-5 w-5 text-muted-foreground' />
                          <span className='flex-1 text-left'>Rename</span>
                          <Icons.forward className='h-4 w-4 text-muted-foreground' />
                        </button>
                      )}

                      {/* Mark as spoiler toggle - only for images */}
                      {currentUpload.file.type.startsWith('image/') && (
                        <div
                          role='button'
                          tabIndex={0}
                          onClick={() => onToggleSpoiler(currentUpload.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onToggleSpoiler(currentUpload.id);
                            }
                          }}
                          className='w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors cursor-pointer'
                        >
                          <Icons.spoiler className='h-5 w-5 text-muted-foreground' />
                          <span className='flex-1 text-left'>
                            Mark as spoiler
                          </span>
                          <Checkbox
                            checked={currentUpload.isSpoiler}
                            onCheckedChange={() =>
                              onToggleSpoiler(currentUpload.id)
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
                  if (drawerUpload) {
                    onRemove(drawerUpload.id);
                    setDrawerUpload(null);
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

        {/* Edit Dialog (shared between mobile and desktop) */}
        <AttachmentEditDialog
          upload={editingUpload}
          open={!!editingUpload}
          onOpenChange={open => !open && setEditingUpload(null)}
          onSave={handleEditSave}
        />
      </>
    );
  }

  // Desktop UI - full preview with action buttons
  return (
    <>
      <div className={cn('space-y-3', className)}>
        {/* Image row - simple left to right layout */}
        {images.length > 0 && (
          <div className='flex flex-wrap gap-2'>
            {images.map(upload => {
              const isRevealed = revealedSpoilers.has(upload.id);
              const showSpoilerOverlay = upload.isSpoiler && !isRevealed;

              return (
                <div
                  key={upload.id}
                  className='relative group rounded-lg overflow-hidden bg-muted size-24'
                >
                  {/* Clickable image with spoiler blur */}
                  <button
                    type='button'
                    onClick={() => handleImageClick(upload)}
                    className='w-full h-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                  >
                    {upload.preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={upload.preview}
                        alt={upload.displayFilename}
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

                  {/* Spoiler label overlay */}
                  {showSpoilerOverlay && (
                    <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                      <span className='bg-black/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full'>
                        SPOILER
                      </span>
                    </div>
                  )}

                  {/* Loading overlay */}
                  {upload.status === 'uploading' && (
                    <div className='absolute inset-0 bg-background/60 flex items-center justify-center pointer-events-none'>
                      <Icons.spinner className='h-5 w-5 animate-spin text-primary' />
                    </div>
                  )}

                  {/* Error overlay */}
                  {upload.status === 'error' && (
                    <div className='absolute inset-0 bg-destructive/20 flex items-center justify-center pointer-events-none'>
                      <Icons.warning className='h-5 w-5 text-destructive' />
                    </div>
                  )}

                  {/* Action buttons - Discord style row with tooltips */}
                  <div className='absolute top-1 right-1 flex gap-1'>
                    {/* Spoiler toggle */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type='button'
                          onClick={e => {
                            e.stopPropagation();
                            onToggleSpoiler(upload.id);
                          }}
                          className={cn(
                            'p-1.5 rounded-md',
                            'bg-black/70 hover:bg-black/90 text-white',
                            'transition-colors',
                            'focus:outline-none focus:ring-1 focus:ring-white'
                          )}
                          aria-label={
                            upload.isSpoiler
                              ? 'Remove spoiler'
                              : 'Mark as spoiler'
                          }
                        >
                          {upload.isSpoiler ? (
                            <Icons.spoilerOff className='h-4 w-4' />
                          ) : (
                            <Icons.spoiler className='h-4 w-4' />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side='bottom'>
                        {upload.isSpoiler
                          ? 'Remove spoiler'
                          : 'Mark as spoiler'}
                      </TooltipContent>
                    </Tooltip>

                    {/* Edit button */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type='button'
                          onClick={e => {
                            e.stopPropagation();
                            setEditingUpload(upload);
                          }}
                          className={cn(
                            'p-1.5 rounded-md',
                            'bg-black/70 hover:bg-black/90 text-white',
                            'transition-colors',
                            'focus:outline-none focus:ring-1 focus:ring-white'
                          )}
                          aria-label={`Edit ${upload.displayFilename}`}
                        >
                          <Icons.edit className='h-4 w-4' />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side='bottom'>
                        Edit attachment
                      </TooltipContent>
                    </Tooltip>

                    {/* Delete button */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type='button'
                          onClick={e => {
                            e.stopPropagation();
                            onRemove(upload.id);
                          }}
                          className={cn(
                            'p-1.5 rounded-md',
                            'bg-black/70 hover:bg-destructive text-white',
                            'transition-colors',
                            'focus:outline-none focus:ring-1 focus:ring-white'
                          )}
                          aria-label={`Remove ${upload.displayFilename}`}
                        >
                          <Icons.delete className='h-4 w-4' />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side='bottom'>Remove</TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Filename below image (if edited) */}
                  {upload.displayFilename !== upload.file.name && (
                    <div className='absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/70 text-white text-xs truncate pointer-events-none'>
                      {upload.displayFilename}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Video previews */}
        {videos.length > 0 && (
          <div className='space-y-2'>
            {videos.map(upload => (
              <div
                key={upload.id}
                className='relative group rounded-md overflow-hidden bg-muted max-w-md'
              >
                {upload.preview ? (
                  <video
                    src={upload.preview}
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
                  <span className='truncate flex-1'>
                    {upload.displayFilename}
                  </span>
                  <span className='text-xs'>
                    ({formatFileSize(upload.file.size)})
                  </span>
                  {upload.status === 'uploading' && (
                    <Icons.spinner className='h-3.5 w-3.5 animate-spin' />
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type='button'
                        onClick={() => setEditingUpload(upload)}
                        className='p-1 rounded hover:bg-accent transition-colors focus:outline-none'
                        aria-label={`Edit ${upload.displayFilename}`}
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
                        onClick={() => onRemove(upload.id)}
                        className='p-1 rounded hover:bg-destructive hover:text-destructive-foreground transition-colors focus:outline-none'
                        aria-label={`Remove ${upload.displayFilename}`}
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

        {/* Audio previews */}
        {audio.length > 0 && (
          <div className='space-y-2'>
            {audio.map(upload => (
              <div
                key={upload.id}
                className='relative group rounded-md bg-muted p-3 max-w-md'
              >
                <div className='flex items-center gap-2 mb-2 text-sm text-muted-foreground'>
                  <Icons.fileAudio className='h-4 w-4' />
                  <span className='truncate flex-1'>
                    {upload.displayFilename}
                  </span>
                  <span className='text-xs'>
                    ({formatFileSize(upload.file.size)})
                  </span>
                  {upload.status === 'uploading' && (
                    <Icons.spinner className='h-3.5 w-3.5 animate-spin' />
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type='button'
                        onClick={() => setEditingUpload(upload)}
                        className='p-1 rounded hover:bg-accent transition-colors focus:outline-none'
                        aria-label={`Edit ${upload.displayFilename}`}
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
                        onClick={() => onRemove(upload.id)}
                        className='p-1 rounded hover:bg-destructive hover:text-destructive-foreground transition-colors focus:outline-none'
                        aria-label={`Remove ${upload.displayFilename}`}
                      >
                        <Icons.delete className='h-3.5 w-3.5' />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side='bottom'>Remove</TooltipContent>
                  </Tooltip>
                </div>
                {upload.preview ? (
                  <audio src={upload.preview} controls className='w-full'>
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

        {/* Other files list */}
        {otherFiles.length > 0 && (
          <div className='flex flex-wrap gap-2'>
            {otherFiles.map(upload => (
              <div
                key={upload.id}
                className={cn(
                  'group flex items-center gap-2 px-3 py-2 rounded-md',
                  'bg-muted border border-border',
                  'text-sm'
                )}
              >
                <FileIcon
                  mimeType={upload.file.type}
                  className='h-4 w-4 text-muted-foreground flex-shrink-0'
                />
                <span className='max-w-[120px] truncate'>
                  {upload.displayFilename}
                </span>

                {upload.status === 'uploading' && (
                  <Icons.spinner className='h-3.5 w-3.5 animate-spin flex-shrink-0' />
                )}

                {upload.status === 'error' && (
                  <Icons.warning className='h-3.5 w-3.5 text-destructive flex-shrink-0' />
                )}

                {/* Edit button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type='button'
                      onClick={() => setEditingUpload(upload)}
                      className={cn(
                        'p-1 rounded hover:bg-accent flex-shrink-0',
                        'transition-colors',
                        'focus:outline-none'
                      )}
                      aria-label={`Edit ${upload.displayFilename}`}
                    >
                      <Icons.edit className='h-3.5 w-3.5' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='bottom'>Edit attachment</TooltipContent>
                </Tooltip>

                {/* Delete button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type='button'
                      onClick={() => onRemove(upload.id)}
                      className={cn(
                        'p-1 rounded hover:bg-destructive hover:text-destructive-foreground flex-shrink-0',
                        'transition-colors',
                        'focus:outline-none'
                      )}
                      aria-label={`Remove ${upload.displayFilename}`}
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

      {/* Edit Dialog */}
      <AttachmentEditDialog
        upload={editingUpload}
        open={!!editingUpload}
        onOpenChange={open => !open && setEditingUpload(null)}
        onSave={handleEditSave}
      />

      {/* Image Lightbox */}
      <Dialog
        open={!!lightboxUpload}
        onOpenChange={() => setLightboxUpload(null)}
      >
        <DialogContent className='max-w-4xl max-h-[90vh] p-0 overflow-hidden'>
          <VisuallyHidden>
            <DialogTitle>
              {lightboxUpload?.displayFilename || 'Image'}
            </DialogTitle>
          </VisuallyHidden>
          {lightboxUpload?.preview && (
            <div className='relative'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxUpload.preview}
                alt={lightboxUpload.altText || lightboxUpload.displayFilename}
                className='w-full h-auto max-h-[85vh] object-contain'
              />
              <div className='absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent'>
                <div className='flex items-center justify-between text-white'>
                  <div className='flex-1 min-w-0'>
                    <span className='text-sm truncate block'>
                      {lightboxUpload.displayFilename}
                    </span>
                    {lightboxUpload.altText && (
                      <span className='text-xs text-white/70 truncate block'>
                        {lightboxUpload.altText}
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

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
