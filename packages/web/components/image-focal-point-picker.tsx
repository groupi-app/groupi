'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

export interface FocalPoint {
  x: number; // 0-1 normalized (0.5 = center)
  y: number; // 0-1 normalized (0.5 = center)
}

/**
 * Calculate object-position that centers the focal point in the cropped view.
 *
 * CSS object-position percentages don't directly center a point - they align
 * the image's X%/Y% point with the container's X%/Y% point. To center a focal
 * point, we need to calculate the correct position based on aspect ratios.
 */
export function calculateObjectPosition(
  focalX: number,
  focalY: number,
  imageWidth: number,
  imageHeight: number,
  containerWidth: number,
  containerHeight: number
): { x: number; y: number } {
  const imageAspect = imageWidth / imageHeight;
  const containerAspect = containerWidth / containerHeight;

  let posX = focalX * 100;
  let posY = focalY * 100;

  if (imageAspect > containerAspect) {
    // Image is wider than container - horizontal cropping happens
    const scale = containerHeight / imageHeight;
    const scaledWidth = imageWidth * scale;
    const overflow = scaledWidth - containerWidth;
    if (overflow > 0) {
      // Calculate position to center the focal point horizontally
      const targetOffset = focalX * scaledWidth - containerWidth / 2;
      posX = (targetOffset / overflow) * 100;
      posX = Math.max(0, Math.min(100, posX));
    }
  } else {
    // Image is taller than container - vertical cropping happens
    const scale = containerWidth / imageWidth;
    const scaledHeight = imageHeight * scale;
    const overflow = scaledHeight - containerHeight;
    if (overflow > 0) {
      // Calculate position to center the focal point vertically
      const targetOffset = focalY * scaledHeight - containerHeight / 2;
      posY = (targetOffset / overflow) * 100;
      posY = Math.max(0, Math.min(100, posY));
    }
  }

  return { x: posX, y: posY };
}

interface ImageFocalPointPickerProps {
  imageUrl: string;
  initialFocalPoint?: FocalPoint;
  onSave: (focalPoint: FocalPoint) => void;
  onCancel: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Track image bounds for crosshair positioning
interface ImageBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Inner component that resets state when remounted
function FocalPointPickerContent({
  imageUrl,
  initialFocalPoint,
  onSave,
  onCancel,
  onOpenChange,
}: Omit<ImageFocalPointPickerProps, 'open'>) {
  const [focalPoint, setFocalPoint] = useState<FocalPoint>(
    initialFocalPoint ?? { x: 0.5, y: 0.5 }
  );
  const [isDragging, setIsDragging] = useState(false);
  const [imageBounds, setImageBounds] = useState<ImageBounds | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [previewContainerSize, setPreviewContainerSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Update image bounds when image loads or container resizes
  const updateImageBounds = useCallback(() => {
    const image = imageRef.current;
    const container = containerRef.current;
    if (!image || !container) return;

    // Get the actual rendered position and size of the image within the container
    // When using object-contain, the image may be smaller than the container
    const containerRect = container.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();

    setImageBounds({
      left: imageRect.left - containerRect.left,
      top: imageRect.top - containerRect.top,
      width: imageRect.width,
      height: imageRect.height,
    });

    // Store natural image dimensions
    setImageNaturalSize({
      width: image.naturalWidth,
      height: image.naturalHeight,
    });

    // Update preview container size
    const previewContainer = previewContainerRef.current;
    if (previewContainer) {
      setPreviewContainerSize({
        width: previewContainer.offsetWidth,
        height: previewContainer.offsetHeight,
      });
    }
  }, []);

  // Update bounds when image loads
  const handleImageLoad = useCallback(() => {
    updateImageBounds();
  }, [updateImageBounds]);

  // Also update on window resize
  useEffect(() => {
    window.addEventListener('resize', updateImageBounds);
    return () => window.removeEventListener('resize', updateImageBounds);
  }, [updateImageBounds]);

  // Calculate the correct object-position for the preview
  const previewObjectPosition = (() => {
    if (!imageNaturalSize || !previewContainerSize) {
      return 'center';
    }
    const pos = calculateObjectPosition(
      focalPoint.x,
      focalPoint.y,
      imageNaturalSize.width,
      imageNaturalSize.height,
      previewContainerSize.width,
      previewContainerSize.height
    );
    return `${pos.x}% ${pos.y}%`;
  })();

  // Calculate focal point relative to the actual image, not the container
  const updateFocalPoint = useCallback((clientX: number, clientY: number) => {
    const image = imageRef.current;
    if (!image) return;

    const rect = image.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    setFocalPoint({ x, y });
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      updateFocalPoint(e.clientX, e.clientY);
    },
    [updateFocalPoint]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      updateFocalPoint(e.clientX, e.clientY);
    },
    [isDragging, updateFocalPoint]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch event handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      setIsDragging(true);
      updateFocalPoint(touch.clientX, touch.clientY);
    },
    [updateFocalPoint]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      updateFocalPoint(touch.clientX, touch.clientY);
    },
    [isDragging, updateFocalPoint]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleSave = () => {
    onSave(focalPoint);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const handleReset = () => {
    setFocalPoint({ x: 0.5, y: 0.5 });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Adjust Image Position</DialogTitle>
      </DialogHeader>

      <div className='space-y-4'>
        {/* Instructions */}
        <p className='text-sm text-muted-foreground'>
          Click or drag to set the focal point. This determines which part of
          the image stays visible when cropped in the event header.
        </p>

        {/* Main image with focal point picker - shows full uncropped image */}
        <div
          ref={containerRef}
          className={cn(
            'relative w-full flex items-center justify-center bg-muted/50 rounded-lg border overflow-hidden',
            isDragging ? 'cursor-grabbing' : 'cursor-crosshair'
          )}
          style={{ minHeight: '200px', maxHeight: '400px' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Blob URLs for upload preview require native img */}
          <img
            ref={imageRef}
            src={imageUrl}
            alt='Click to set focal point'
            className='max-w-full max-h-[400px] object-contain select-none'
            draggable={false}
            style={{ pointerEvents: 'none' }}
            onLoad={handleImageLoad}
          />

          {/* Crosshair marker - positioned relative to image using state */}
          {imageBounds && (
            <div
              className='absolute pointer-events-none z-10'
              style={{
                left: imageBounds.left + imageBounds.width * focalPoint.x,
                top: imageBounds.top + imageBounds.height * focalPoint.y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Outer ring */}
              <div
                className='absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg'
                style={{
                  boxShadow:
                    '0 0 0 2px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.3)',
                }}
              />
              {/* Inner dot */}
              <div className='absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary border-2 border-white shadow-lg' />
            </div>
          )}
        </div>

        {/* Preview showing how image will look when cropped */}
        <div className='space-y-2'>
          <p className='text-sm font-medium'>Preview (cropped view)</p>
          <div
            ref={previewContainerRef}
            className='relative aspect-[21/9] md:aspect-[32/9] w-full overflow-hidden rounded-lg border'
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- Blob URLs for upload preview require native img */}
            <img
              src={imageUrl}
              alt='Cropped preview'
              className='w-full h-full object-cover pointer-events-none'
              style={{
                objectPosition: previewObjectPosition,
              }}
            />
          </div>
        </div>
      </div>

      <DialogFooter className='flex-col sm:flex-row gap-2'>
        <Button
          type='button'
          variant='ghost'
          onClick={handleReset}
          className='sm:mr-auto'
        >
          <Icons.undo className='size-4 mr-2' />
          Reset to Center
        </Button>
        <Button type='button' variant='outline' onClick={handleCancel}>
          Cancel
        </Button>
        <Button type='button' onClick={handleSave}>
          Save Position
        </Button>
      </DialogFooter>
    </>
  );
}

// Wrapper component that uses key to remount content when dialog opens
export function ImageFocalPointPicker({
  imageUrl,
  initialFocalPoint,
  onSave,
  onCancel,
  open,
  onOpenChange,
}: ImageFocalPointPickerProps) {
  // Use a counter to force remount when dialog opens
  // This resets the internal focal point state to initialFocalPoint
  const [mountKey, setMountKey] = useState(0);

  // Increment key when dialog opens to remount content
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        setMountKey(prev => prev + 1);
      }
      onOpenChange(isOpen);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-w-2xl'>
        {open && (
          <FocalPointPickerContent
            key={mountKey}
            imageUrl={imageUrl}
            initialFocalPoint={initialFocalPoint}
            onSave={onSave}
            onCancel={onCancel}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
