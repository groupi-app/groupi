import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';

import { useImagePicker } from '@/hooks/use-image-picker';
import { useActionMenu } from '@/components/ui/action-menu';
import { ImageFocalPointPicker } from './image-focal-point-picker';
import { FocalImage } from './focal-image';
import type { FocalPoint } from '@/lib/image-focal-point';

interface EventImageUploadProps {
  imageUri?: string | null;
  existingImageUrl?: string | null;
  onImageSelected: (uri: string, filename: string, mimeType: string) => void;
  onImageRemoved: () => void;
  focalPoint?: FocalPoint | null;
  onFocalPointChange?: (focalPoint: FocalPoint | null) => void;
  disabled?: boolean;
}

export function EventImageUpload({
  imageUri,
  existingImageUrl,
  onImageSelected,
  onImageRemoved,
  focalPoint,
  onFocalPointChange,
  disabled = false,
}: EventImageUploadProps) {
  const { pickImage, takePhoto } = useImagePicker();
  const { showActionMenu } = useActionMenu();
  const [focalPointPickerOpen, setFocalPointPickerOpen] = useState(false);

  const displayUri = imageUri ?? existingImageUrl;

  async function chooseFromLibrary() {
    const result = await pickImage({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (result) {
      onImageSelected(result.uri, result.filename, result.mimeType);
      onFocalPointChange?.({ x: 0.5, y: 0.5 });
    }
  }

  async function takeNewPhoto() {
    const result = await takePhoto({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (result) {
      onImageSelected(result.uri, result.filename, result.mimeType);
      onFocalPointChange?.({ x: 0.5, y: 0.5 });
    }
  }

  function handlePress() {
    if (disabled) return;

    const hasImage = !!displayUri;

    showActionMenu({
      title: 'Event Cover Image',
      options: [
        {
          label: 'Take Photo',
          icon: 'camera-outline',
          onPress: () => void takeNewPhoto(),
        },
        {
          label: 'Choose from Library',
          icon: 'images-outline',
          onPress: () => void chooseFromLibrary(),
        },
        ...(hasImage && onFocalPointChange
          ? [
              {
                label: 'Adjust Position',
                icon: 'locate-outline' as const,
                onPress: () => setFocalPointPickerOpen(true),
              },
            ]
          : []),
        ...(hasImage
          ? [
              {
                label: 'Remove Image',
                icon: 'trash-outline' as const,
                destructive: true,
                onPress: () => {
                  onImageRemoved();
                  onFocalPointChange?.(null);
                },
              },
            ]
          : []),
      ],
    });
  }

  if (displayUri) {
    return (
      <>
        <Pressable
          onPress={handlePress}
          disabled={disabled}
          accessibilityRole='button'
          accessibilityLabel='Change event cover image'
          accessibilityState={{ disabled }}
        >
          <View className='overflow-hidden rounded-card'>
            <FocalImage
              uri={displayUri}
              focalPoint={focalPoint}
              className='h-48 w-full'
            />
            <View className='absolute bottom-2 right-2 flex-row items-center gap-1 rounded-badge bg-black/60 px-2 py-1'>
              <Ionicons name='camera' size={14} color='#ffffff' />
              <Text className='text-xs font-medium text-white'>Change</Text>
            </View>
          </View>
        </Pressable>
        {onFocalPointChange && focalPointPickerOpen ? (
          <ImageFocalPointPicker
            imageUri={displayUri}
            focalPoint={focalPoint}
            open={focalPointPickerOpen}
            onSave={nextFocalPoint => {
              onFocalPointChange(nextFocalPoint);
              setFocalPointPickerOpen(false);
            }}
            onClose={() => setFocalPointPickerOpen(false)}
          />
        ) : null}
      </>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole='button'
      accessibilityLabel='Add event cover image'
      accessibilityState={{ disabled }}
    >
      <View className='h-32 items-center justify-center rounded-card border-2 border-dashed border-border'>
        <Ionicons name='image-outline' size={32} color='#9ca3af' />
        <Text className='mt-2 text-sm text-muted-foreground'>
          Add cover image
        </Text>
      </View>
    </Pressable>
  );
}
