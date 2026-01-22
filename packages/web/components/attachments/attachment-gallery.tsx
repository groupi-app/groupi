'use client';

import { useState, useCallback } from 'react';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Download a file by fetching it as a blob and triggering a download.
 * This is needed because cross-origin URLs (like Convex storage) ignore the
 * HTML download attribute.
 */
async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Revoke the blob URL after a short delay to allow the download to start
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (error) {
    console.error('Download failed:', error);
    // Fallback: open in new tab if download fails
    window.open(url, '_blank');
  }
}

interface Attachment {
  _id: string;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';
  filename: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  url: string | null;
  isSpoiler?: boolean;
  altText?: string;
}

interface AttachmentGalleryProps {
  attachments: Attachment[];
  className?: string;
  /** If provided, shows delete buttons and calls this when delete is clicked */
  onDelete?: (attachmentId: string) => void;
  /** Whether delete is in progress (disables buttons) */
  isDeleting?: boolean;
}

// Max width for the gallery on desktop - height is controlled by aspect ratios
const MAX_GALLERY_WIDTH = 450; // px

/**
 * Displays attachments in a Discord-style gallery layout
 * Images are tiled based on count, other files are shown as download links
 * Spoiler images are blurred until clicked
 */
export function AttachmentGallery({
  attachments,
  className,
  onDelete,
  isDeleting = false,
}: AttachmentGalleryProps) {
  const [lightboxImage, setLightboxImage] = useState<Attachment | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  // Track which spoilers have been revealed (click once to reveal, click again to expand)
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(
    new Set()
  );
  // Track which files are currently being downloaded
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(
    new Set()
  );

  const handleImageLoad = useCallback((id: string) => {
    setLoadedImages(prev => new Set(prev).add(id));
  }, []);

  const handleImageClick = useCallback(
    (attachment: Attachment) => {
      // If it's a spoiler that hasn't been revealed, reveal it
      if (attachment.isSpoiler && !revealedSpoilers.has(attachment._id)) {
        setRevealedSpoilers(prev => new Set(prev).add(attachment._id));
        return;
      }
      // Otherwise, open lightbox
      setLightboxImage(attachment);
    },
    [revealedSpoilers]
  );

  const handleDownload = useCallback(
    async (attachmentId: string, url: string, filename: string) => {
      // Prevent double-clicks
      if (downloadingFiles.has(attachmentId)) return;

      setDownloadingFiles(prev => new Set(prev).add(attachmentId));
      try {
        await downloadFile(url, filename);
      } finally {
        setDownloadingFiles(prev => {
          const next = new Set(prev);
          next.delete(attachmentId);
          return next;
        });
      }
    },
    [downloadingFiles]
  );

  if (!attachments || attachments.length === 0) return null;

  // Separate by type
  const images = attachments.filter(a => a.type === 'IMAGE' && a.url);
  const videos = attachments.filter(a => a.type === 'VIDEO' && a.url);
  const audio = attachments.filter(a => a.type === 'AUDIO' && a.url);
  const files = attachments.filter(a => a.type === 'FILE' && a.url);

  // Render a single image tile
  const renderImageTile = (attachment: Attachment) => {
    const isLoaded = loadedImages.has(attachment._id);
    const isSpoiler = attachment.isSpoiler;
    const isRevealed = revealedSpoilers.has(attachment._id);
    const showSpoilerOverlay = isSpoiler && !isRevealed;

    return (
      <div
        key={attachment._id}
        className='relative w-full h-full isolate group/tile'
      >
        <button
          type='button'
          onClick={() => handleImageClick(attachment)}
          className={cn(
            'relative w-full h-full rounded-md overflow-hidden bg-muted',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
          )}
        >
          {/* Skeleton while loading */}
          {!isLoaded && <Skeleton className='absolute inset-0 w-full h-full' />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attachment.url!}
            alt={attachment.altText || attachment.filename}
            className={cn(
              'w-full h-full object-cover transition-all',
              !isLoaded && 'opacity-0',
              showSpoilerOverlay && 'blur-xl scale-110',
              !showSpoilerOverlay && 'group-hover/tile:scale-105'
            )}
            loading='lazy'
            onLoad={() => handleImageLoad(attachment._id)}
          />

          {/* Spoiler overlay */}
          {showSpoilerOverlay && (
            <div className='absolute inset-0 flex items-center justify-center bg-black/20'>
              <span className='bg-black/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full'>
                SPOILER
              </span>
            </div>
          )}

          {/* Hover overlay (only when not spoiler or revealed) */}
          {!showSpoilerOverlay && (
            <div className='absolute inset-0 bg-black/0 group-hover/tile:bg-black/10 transition-colors' />
          )}
        </button>
        {/* Delete button - trash icon overlay */}
        {onDelete && (
          <button
            type='button'
            onClick={e => {
              e.stopPropagation();
              onDelete(attachment._id);
            }}
            disabled={isDeleting}
            className={cn(
              'absolute top-1 right-1 p-1.5 rounded z-10',
              'bg-black/70 hover:bg-destructive text-white',
              'opacity-0 group-hover/tile:opacity-100 transition-opacity',
              'focus:outline-none focus:ring-1 focus:ring-white',
              'disabled:opacity-50'
            )}
            aria-label={`Remove ${attachment.filename}`}
          >
            <Icons.delete className='h-4 w-4' />
          </button>
        )}
      </div>
    );
  };

  // Discord-style image gallery layout
  const renderImageGallery = () => {
    const count = images.length;

    if (count === 0) return null;

    // 1 image: single large image
    if (count === 1) {
      return (
        <div className='w-full aspect-[4/3]'>{renderImageTile(images[0])}</div>
      );
    }

    // 2 images: side by side
    if (count === 2) {
      return (
        <div className='flex gap-1 w-full'>
          <div className='w-1/2 aspect-[3/4]'>{renderImageTile(images[0])}</div>
          <div className='w-1/2 aspect-[3/4]'>{renderImageTile(images[1])}</div>
        </div>
      );
    }

    // 3 images: large left, 2 stacked right
    // Using grid to ensure consistent heights
    if (count === 3) {
      return (
        <div className='grid grid-cols-5 grid-rows-2 gap-1 w-full aspect-[5/4]'>
          <div className='col-span-3 row-span-2'>
            {renderImageTile(images[0])}
          </div>
          <div className='col-span-2 row-span-1'>
            {renderImageTile(images[1])}
          </div>
          <div className='col-span-2 row-span-1'>
            {renderImageTile(images[2])}
          </div>
        </div>
      );
    }

    // 4 images: 2x2 grid
    if (count === 4) {
      return (
        <div className='grid grid-cols-2 gap-1 w-full'>
          {images.map(img => (
            <div key={img._id} className='aspect-square'>
              {renderImageTile(img)}
            </div>
          ))}
        </div>
      );
    }

    // 5 images: 2 on top (larger), 3 on bottom
    // Using grid with 6 columns for proper alignment
    if (count === 5) {
      return (
        <div className='grid grid-cols-6 gap-1 w-full'>
          <div className='col-span-3 aspect-[4/3]'>
            {renderImageTile(images[0])}
          </div>
          <div className='col-span-3 aspect-[4/3]'>
            {renderImageTile(images[1])}
          </div>
          <div className='col-span-2 aspect-square'>
            {renderImageTile(images[2])}
          </div>
          <div className='col-span-2 aspect-square'>
            {renderImageTile(images[3])}
          </div>
          <div className='col-span-2 aspect-square'>
            {renderImageTile(images[4])}
          </div>
        </div>
      );
    }

    // 6 images: 2 rows of 3
    if (count === 6) {
      return (
        <div className='grid grid-cols-3 gap-1 w-full'>
          {images.map(img => (
            <div key={img._id} className='aspect-square'>
              {renderImageTile(img)}
            </div>
          ))}
        </div>
      );
    }

    // 7+ images: 1 large on top, then rows of 3
    const firstImage = images[0];
    const remainingImages = images.slice(1);

    return (
      <div className='flex flex-col gap-1 w-full'>
        {/* First image - full width */}
        <div className='w-full aspect-[16/9]'>
          {renderImageTile(firstImage)}
        </div>
        {/* Remaining images in rows of 3 */}
        <div className='grid grid-cols-3 gap-1'>
          {remainingImages.map(img => (
            <div key={img._id} className='aspect-square'>
              {renderImageTile(img)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Image Gallery - Discord style tiling */}
      {images.length > 0 && (
        <div style={{ maxWidth: MAX_GALLERY_WIDTH }} className='w-full'>
          {renderImageGallery()}
        </div>
      )}

      {/* Video Players */}
      {videos.length > 0 && (
        <div className='space-y-2'>
          {videos.map(attachment => (
            <div
              key={attachment._id}
              className='relative group rounded-md overflow-hidden bg-muted max-w-lg'
            >
              <video
                src={attachment.url!}
                controls
                className='w-full max-h-80'
                preload='metadata'
              >
                Your browser does not support video playback.
              </video>
              <div className='px-3 py-2 text-sm text-muted-foreground flex items-center gap-2'>
                <Icons.fileVideo className='h-4 w-4' />
                <span className='truncate flex-1'>{attachment.filename}</span>
                <span className='text-xs'>
                  ({formatFileSize(attachment.size)})
                </span>
                {onDelete && (
                  <button
                    type='button'
                    onClick={() => onDelete(attachment._id)}
                    disabled={isDeleting}
                    className={cn(
                      'p-1.5 rounded bg-black/70 hover:bg-destructive text-white',
                      'transition-colors',
                      'focus:outline-none disabled:opacity-50'
                    )}
                    aria-label={`Remove ${attachment.filename}`}
                  >
                    <Icons.delete className='h-3.5 w-3.5' />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audio Players */}
      {audio.length > 0 && (
        <div className='space-y-2'>
          {audio.map(attachment => (
            <div
              key={attachment._id}
              className='relative group rounded-md bg-muted p-3 max-w-lg'
            >
              {/* Delete button - trash icon overlay */}
              {onDelete && (
                <button
                  type='button'
                  onClick={() => onDelete(attachment._id)}
                  disabled={isDeleting}
                  className={cn(
                    'absolute top-1 right-1 p-1.5 rounded z-10',
                    'bg-black/70 hover:bg-destructive text-white',
                    'transition-colors',
                    'focus:outline-none focus:ring-1 focus:ring-white',
                    'disabled:opacity-50'
                  )}
                  aria-label={`Remove ${attachment.filename}`}
                >
                  <Icons.delete className='h-4 w-4' />
                </button>
              )}
              <div className='flex items-center gap-2 mb-2 text-sm text-muted-foreground'>
                <Icons.fileAudio className='h-4 w-4' />
                <span className='truncate flex-1'>{attachment.filename}</span>
                <span className='text-xs'>
                  ({formatFileSize(attachment.size)})
                </span>
              </div>
              <audio src={attachment.url!} controls className='w-full'>
                Your browser does not support audio playback.
              </audio>
            </div>
          ))}
        </div>
      )}

      {/* File Downloads */}
      {files.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          {files.map(attachment => {
            const isDownloading = downloadingFiles.has(attachment._id);
            return (
              <div
                key={attachment._id}
                className='relative group flex items-center min-w-0 max-w-full'
              >
                <button
                  type='button'
                  onClick={() =>
                    handleDownload(
                      attachment._id,
                      attachment.url!,
                      attachment.filename
                    )
                  }
                  disabled={isDownloading}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md min-w-0 max-w-full',
                    'bg-muted border border-border',
                    'hover:bg-accent transition-colors',
                    'text-sm',
                    'disabled:opacity-70 disabled:cursor-wait'
                  )}
                >
                  <Icons.file className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                  <span className='truncate min-w-0'>
                    {attachment.filename}
                  </span>
                  <span className='text-muted-foreground text-xs whitespace-nowrap flex-shrink-0'>
                    {formatFileSize(attachment.size)}
                  </span>
                  {isDownloading ? (
                    <Icons.spinner className='h-3 w-3 text-muted-foreground animate-spin flex-shrink-0' />
                  ) : (
                    <Icons.download className='h-3 w-3 text-muted-foreground flex-shrink-0' />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Lightbox */}
      <Dialog
        open={!!lightboxImage}
        onOpenChange={() => setLightboxImage(null)}
      >
        <DialogContent className='max-w-4xl max-h-[90vh] p-0 overflow-hidden'>
          <VisuallyHidden>
            <DialogTitle>{lightboxImage?.filename || 'Image'}</DialogTitle>
          </VisuallyHidden>
          {lightboxImage && (
            <div className='relative'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxImage.url!}
                alt={lightboxImage.altText || lightboxImage.filename}
                className='w-full h-auto max-h-[85vh] object-contain'
              />
              <div className='absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent'>
                <div className='flex items-center justify-between text-white'>
                  <div className='flex-1 min-w-0'>
                    <span className='text-sm truncate block'>
                      {lightboxImage.filename}
                    </span>
                    {lightboxImage.altText && (
                      <span className='text-xs text-white/70 truncate block'>
                        {lightboxImage.altText}
                      </span>
                    )}
                  </div>
                  <button
                    type='button'
                    onClick={() =>
                      handleDownload(
                        lightboxImage._id,
                        lightboxImage.url!,
                        lightboxImage.filename
                      )
                    }
                    disabled={downloadingFiles.has(lightboxImage._id)}
                    className='flex items-center gap-1 text-sm hover:underline flex-shrink-0 ml-2 disabled:opacity-70 disabled:cursor-wait'
                  >
                    {downloadingFiles.has(lightboxImage._id) ? (
                      <Icons.spinner className='h-4 w-4 animate-spin' />
                    ) : (
                      <Icons.download className='h-4 w-4' />
                    )}
                    {downloadingFiles.has(lightboxImage._id)
                      ? 'Downloading...'
                      : 'Download'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
