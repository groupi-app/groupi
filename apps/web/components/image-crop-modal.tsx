'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Area } from 'react-easy-crop';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ZoomIn } from 'lucide-react';

interface ImageCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
}

export function ImageCropModal({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropAreaChange = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createCroppedImage = async (): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc;

    return new Promise((resolve, reject) => {
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx || !croppedAreaPixels) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Set canvas size to cropped area
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        // Draw cropped image
        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );

        // Convert canvas to blob
        canvas.toBlob(blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/jpeg');
      };

      image.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    });
  };

  const handleApply = async () => {
    try {
      const croppedBlob = await createCroppedImage();
      onCropComplete(croppedBlob);
      onOpenChange(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error cropping image:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>Crop Avatar</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Crop Area */}
          <div className='relative h-[400px] bg-muted rounded-lg overflow-hidden'>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape='round'
              showGrid={false}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropAreaChange={onCropAreaChange}
            />
          </div>

          {/* Zoom Control */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <ZoomIn className='h-4 w-4' />
              <Label htmlFor='zoom'>Zoom</Label>
            </div>
            <Slider
              id='zoom'
              min={1}
              max={3}
              step={0.1}
              value={[zoom]}
              onValueChange={values => setZoom(values[0])}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='ghost'
            onClick={() => onOpenChange(false)}
            className='flex-1'
          >
            Cancel
          </Button>
          <Button type='button' onClick={handleApply} className='flex-1'>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
