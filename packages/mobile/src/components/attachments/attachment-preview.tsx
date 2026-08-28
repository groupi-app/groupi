import { View, Image, Pressable, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import type { PendingUpload } from '@/hooks/use-file-upload';

interface AttachmentPreviewProps {
  uploads: PendingUpload[];
  onRemove: (id: string) => void;
}

export function AttachmentPreview({
  uploads,
  onRemove,
}: AttachmentPreviewProps) {
  if (uploads.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className='border-t border-border px-3 py-2'
      contentContainerClassName='gap-2'
    >
      {uploads.map(upload => {
        const isImage = upload.mimeType.startsWith('image/');
        const isError = upload.status === 'error';
        const isUploading = upload.status === 'uploading';

        return (
          <View key={upload.id} className='relative'>
            {isImage ? (
              <Image
                source={{ uri: upload.uri }}
                className={`h-16 w-16 rounded-input ${isError ? 'opacity-50' : ''}`}
                resizeMode='cover'
              />
            ) : (
              <View
                className={`h-16 w-16 items-center justify-center rounded-input bg-muted ${isError ? 'opacity-50' : ''}`}
              >
                <Ionicons name='document-outline' size={24} color='#9ca3af' />
                <Text
                  className='mt-0.5 text-[10px] text-muted-foreground'
                  numberOfLines={1}
                >
                  {upload.filename.split('.').pop()?.toUpperCase()}
                </Text>
              </View>
            )}

            {/* Upload indicator */}
            {isUploading ? (
              <View className='absolute inset-0 items-center justify-center rounded-input bg-black/40'>
                <Ionicons name='cloud-upload' size={18} color='#ffffff' />
              </View>
            ) : null}

            {/* Error indicator */}
            {isError ? (
              <View className='absolute inset-0 items-center justify-center rounded-input bg-error/20'>
                <Ionicons name='alert-circle' size={18} color='#ef4444' />
              </View>
            ) : null}

            {/* Remove button */}
            <Pressable
              onPress={() => onRemove(upload.id)}
              className='absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-foreground'
              hitSlop={12}
              accessibilityRole='button'
              accessibilityLabel={`Remove ${upload.filename}`}
            >
              <Ionicons name='close' size={12} color='#ffffff' />
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}
