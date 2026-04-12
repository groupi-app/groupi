import { View, Pressable, Image } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';

import { useImagePicker } from '@/hooks/use-image-picker';
import { showActionSheet } from '@/components/ui/action-sheet';

interface EventImageUploadProps {
  imageUri?: string | null;
  existingImageUrl?: string | null;
  onImageSelected: (uri: string, filename: string, mimeType: string) => void;
  onImageRemoved: () => void;
  disabled?: boolean;
}

export function EventImageUpload({
  imageUri,
  existingImageUrl,
  onImageSelected,
  onImageRemoved,
  disabled = false,
}: EventImageUploadProps) {
  const { pickImage, takePhoto } = useImagePicker();

  const displayUri = imageUri ?? existingImageUrl;

  function handlePress() {
    if (disabled) return;

    const options: {
      label: string;
      onPress: () => void;
      destructive?: boolean;
    }[] = [
      {
        label: 'Choose from Library',
        onPress: async () => {
          const result = await pickImage({
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
          });
          if (result) {
            onImageSelected(result.uri, result.filename, result.mimeType);
          }
        },
      },
      {
        label: 'Take Photo',
        onPress: async () => {
          const result = await takePhoto({
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
          });
          if (result) {
            onImageSelected(result.uri, result.filename, result.mimeType);
          }
        },
      },
    ];

    if (displayUri) {
      options.push({
        label: 'Remove Image',
        destructive: true,
        onPress: onImageRemoved,
      });
    }

    showActionSheet({ title: 'Event Cover Image', options });
  }

  if (displayUri) {
    return (
      <Pressable onPress={handlePress} disabled={disabled}>
        <View className='overflow-hidden rounded-card'>
          <Image
            source={{ uri: displayUri }}
            className='h-48 w-full'
            resizeMode='cover'
          />
          <View className='absolute bottom-2 right-2 flex-row items-center gap-1 rounded-badge bg-black/60 px-2 py-1'>
            <Ionicons name='camera' size={14} color='#ffffff' />
            <Text className='text-xs font-medium text-white'>Change</Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      <View className='h-32 items-center justify-center rounded-card border-2 border-dashed border-border'>
        <Ionicons name='image-outline' size={32} color='#9ca3af' />
        <Text className='mt-2 text-sm text-muted-foreground'>
          Add cover image
        </Text>
      </View>
    </Pressable>
  );
}
