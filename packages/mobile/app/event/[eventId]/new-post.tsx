import { useState } from 'react';
import {
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { useLocalSearchParams, router } from 'expo-router';
import { useMutation } from 'convex/react';

import { LabeledInput as Input } from '@/components/ui/labeled-input';
import { LabeledTextarea as Textarea } from '@/components/ui/labeled-textarea';
import { BackButton } from '@/components/ui/back-button';
import { AttachmentButton } from '@/components/attachments/attachment-button';
import { AttachmentPreview } from '@/components/attachments/attachment-preview';
import { useCreatePost } from '@/hooks/use-posts';
import { useAttachments } from '@/hooks/use-file-upload';
import { toast } from '@groupi/shared/platform';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

export default function NewPostScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createPost = useCreatePost();
  const createAttachmentsBatch = useMutation(
    api.attachments.mutations.createAttachmentsBatch
  );

  const {
    pendingUploads,
    isUploading,
    addFile,
    removeFile,
    uploadAll,
    clearAll,
  } = useAttachments();

  const isValid = title.trim().length > 0 && content.trim().length > 0;

  async function handleSubmit() {
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      // Create the post first
      const postId = await createPost({
        eventId,
        title: title.trim(),
        content: content.trim(),
      });

      // Upload and attach files if any
      if (pendingUploads.length > 0 && postId) {
        const uploadResults = await uploadAll();

        if (uploadResults.length > 0) {
          await createAttachmentsBatch({
            postId,
            attachments: uploadResults.map(r => ({
              storageId: r.storageId,
              filename: r.filename,
              size: r.size,
              mimeType: r.mimeType,
              width: r.width,
              height: r.height,
            })),
          });
        }
      }

      clearAll();
      toast.success('Post created!');
      router.back();
    } catch {
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <KeyboardAvoidingView
        className='flex-1'
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View className='flex-row items-center justify-between border-b border-border px-4 py-3'>
          <BackButton />
          <Text className='text-lg font-semibold text-foreground'>
            New Post
          </Text>
          <Pressable
            onPress={handleSubmit}
            disabled={!isValid || isSubmitting || isUploading}
            className={`rounded-button px-4 py-2 ${isValid && !isSubmitting && !isUploading ? 'bg-primary' : 'bg-muted'}`}
          >
            <Text
              className={`text-sm font-semibold ${isValid && !isSubmitting && !isUploading ? 'text-primary-foreground' : 'text-muted-foreground'}`}
            >
              {isUploading
                ? 'Uploading...'
                : isSubmitting
                  ? 'Posting...'
                  : 'Post'}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          className='flex-1 px-4 pt-4'
          keyboardShouldPersistTaps='handled'
        >
          <Input
            placeholder='Post title'
            value={title}
            onChangeText={setTitle}
            className='border-0 px-0 text-xl font-bold'
          />
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChangeText={setContent}
            className='mt-2 min-h-[200px] border-0 px-0'
          />
        </ScrollView>

        {/* Attachment preview */}
        <AttachmentPreview uploads={pendingUploads} onRemove={removeFile} />

        {/* Attachment button */}
        <View className='flex-row items-center border-t border-border px-2 py-1'>
          <AttachmentButton
            onFilesSelected={files => {
              for (const file of files) {
                addFile(
                  file.uri,
                  file.filename,
                  file.mimeType,
                  file.width,
                  file.height
                );
              }
            }}
            currentCount={pendingUploads.length}
            disabled={isSubmitting || isUploading}
          />
          {pendingUploads.length > 0 ? (
            <Text className='ml-2 text-sm text-muted-foreground'>
              {pendingUploads.length} file
              {pendingUploads.length === 1 ? '' : 's'} attached
            </Text>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
