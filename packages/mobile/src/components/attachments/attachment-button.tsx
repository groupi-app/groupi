import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';

import { useImagePicker } from '@/hooks/use-image-picker';
import { useActionMenu } from '@/components/ui/action-menu';
import { MAX_ATTACHMENTS } from '@/hooks/use-file-upload';

interface AttachmentButtonProps {
  onFilesSelected: (
    files: {
      uri: string;
      filename: string;
      mimeType: string;
      width?: number;
      height?: number;
    }[]
  ) => void;
  currentCount: number;
  disabled?: boolean;
}

export function AttachmentButton({
  onFilesSelected,
  currentCount,
  disabled = false,
}: AttachmentButtonProps) {
  const { pickMultipleImages, takePhoto } = useImagePicker();
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
              mediaTypes: ['images', 'videos'],
            });
            if (images.length > 0) {
              onFilesSelected(
                images.slice(0, remaining).map(img => ({
                  uri: img.uri,
                  filename: img.filename,
                  mimeType: img.mimeType,
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
                  width: photo.width,
                  height: photo.height,
                },
              ]);
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
      className={`flex-row items-center gap-1 p-2 ${isMaxed ? 'opacity-40' : ''}`}
    >
      <Ionicons
        name='attach'
        size={22}
        color={isMaxed ? '#9ca3af' : '#6b7280'}
      />
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
