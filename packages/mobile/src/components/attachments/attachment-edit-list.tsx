import { Image, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

import { Text } from '@/components/ui/text';

export interface EditableAttachment {
  _id: string;
  url?: string | null;
  type: string;
  filename: string;
  mimeType: string;
}

interface AttachmentEditListProps {
  attachments: EditableAttachment[];
  onRemove: (attachmentId: string) => void;
}

export function AttachmentEditList({
  attachments,
  onRemove,
}: AttachmentEditListProps) {
  const mutedColor = String(
    useCSSVariable('--color-muted-foreground') ?? 'transparent'
  );

  if (attachments.length === 0) return null;

  return (
    <View className='border-t border-border py-2'>
      <Text className='mb-2 px-3 text-xs font-medium text-muted-foreground'>
        Current attachments
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName='gap-2 px-3'
      >
        {attachments.map(attachment => (
          <View key={attachment._id} className='relative'>
            {attachment.type === 'IMAGE' && attachment.url ? (
              <Image
                source={{ uri: attachment.url }}
                className='h-16 w-16 rounded-input'
                resizeMode='cover'
              />
            ) : (
              <View className='h-16 w-16 items-center justify-center rounded-input bg-muted px-1'>
                <Ionicons
                  name={
                    attachment.type === 'VIDEO'
                      ? 'videocam-outline'
                      : attachment.type === 'AUDIO'
                        ? 'musical-notes-outline'
                        : 'document-outline'
                  }
                  size={23}
                  color={mutedColor}
                />
                <Text
                  className='mt-1 text-[10px] text-muted-foreground'
                  numberOfLines={1}
                >
                  {attachment.filename}
                </Text>
              </View>
            )}
            <Pressable
              onPress={() => onRemove(attachment._id)}
              hitSlop={12}
              accessibilityRole='button'
              accessibilityLabel={`Remove ${attachment.filename}`}
              className='absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-foreground'
            >
              <Ionicons name='close' size={12} color='#ffffff' />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
