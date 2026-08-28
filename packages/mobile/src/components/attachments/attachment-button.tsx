import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';

import { useImagePicker } from '@/hooks/use-image-picker';
import { useDocumentPicker } from '@/hooks/use-document-picker';
import { useActionMenu } from '@/components/ui/action-menu';
import { MAX_ATTACHMENTS } from '@/lib/file-upload-policy';

interface AttachmentButtonProps {
  onFilesSelected: (
    files: {
      uri: string;
      filename: string;
      mimeType: string;
      size?: number;
      width?: number;
      height?: number;
    }[]
  ) => void;
  currentCount: number;
  disabled?: boolean;
  showLabel?: boolean;
}

export function AttachmentButton({
  onFilesSelected,
  currentCount,
  disabled = false,
  showLabel = false,
}: AttachmentButtonProps) {
  const { pickMultipleImages, takePhoto } = useImagePicker();
  const { pickFiles } = useDocumentPicker();
  const { showActionMenu } = useActionMenu();

  const remaining = MAX_ATTACHMENTS - currentCount;
  const isMaxed = remaining <= 0;

  function handlePress() {
    if (disabled || isMaxed) return;

    showActionMenu({
      title: 'Add Attachment',
      message: `${remaining} slot${remaining === 1 ? '' : 's'} remaining`,
      options: [
        {
          label: 'Photo Library',
          icon: 'images-outline',
          onPress: async () => {
            const images = await pickMultipleImages({
              mediaTypes: ['images'],
            });
            if (images.length > 0) {
              onFilesSelected(
                images.slice(0, remaining).map(img => ({
                  uri: img.uri,
                  filename: img.filename,
                  mimeType: img.mimeType,
                  size: img.fileSize,
                  width: img.width,
                  height: img.height,
                }))
              );
            }
          },
        },
        {
          label: 'Take Photo',
          icon: 'camera-outline',
          onPress: async () => {
            const photo = await takePhoto();
            if (photo) {
              onFilesSelected([
                {
                  uri: photo.uri,
                  filename: photo.filename,
                  mimeType: photo.mimeType,
                  size: photo.fileSize,
                  width: photo.width,
                  height: photo.height,
                },
              ]);
            }
          },
        },
        {
          label: 'Choose File',
          icon: 'document-attach-outline',
          onPress: async () => {
            const files = await pickFiles();
            if (files.length > 0) {
              onFilesSelected(files.slice(0, remaining));
            }
          },
        },
      ],
    });
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || isMaxed}
      className={`min-h-[44px] min-w-[44px] flex-row items-center justify-center gap-1 p-2 ${isMaxed ? 'opacity-40' : ''}`}
      accessibilityRole='button'
      accessibilityLabel={
        currentCount > 0
          ? `Add attachment, ${currentCount} selected`
          : 'Add attachment'
      }
      accessibilityState={{ disabled: disabled || isMaxed }}
    >
      <Ionicons
        name='attach'
        size={22}
        color={isMaxed ? '#9ca3af' : '#6b7280'}
      />
      {showLabel ? <Text variant='small'>Add attachment</Text> : null}
      {currentCount > 0 ? (
        <View className='rounded-badge bg-primary px-1.5'>
          <Text className='text-xs font-medium text-primary-foreground'>
            {currentCount}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
