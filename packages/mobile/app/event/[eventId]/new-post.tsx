import { useState, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { useLocalSearchParams, router } from 'expo-router';
import { useMutation } from 'convex/react';
import type { Id } from 'convex/_generated/dataModel';
import { api } from 'convex/_generated/api';

import { LabeledInput as Input } from '@/components/ui/labeled-input';
import { BackButton } from '@/components/ui/back-button';
import { AttachmentButton } from '@/components/attachments/attachment-button';
import { AttachmentPreview } from '@/components/attachments/attachment-preview';
import { RichTextEditor } from '@/components/posts/rich-text-editor';
import { useCreatePost } from '@/hooks/use-posts';
import { useAttachments } from '@/hooks/use-file-upload';
import { toast } from '@groupi/shared/platform';

/** Strip empty HTML tags to check if there's real content */
function hasContent(html: string): boolean {
  const stripped = html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
  return stripped.length > 0;
}

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

  const handleContentChange = useCallback((html: string) => {
    setContent(html);
  }, []);

  const isValid = title.trim().length > 0 && hasContent(content);

  async function handleSubmit() {
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const { postId } = await createPost({
        eventId: eventId as Id<'events'>,
        title: title.trim(),
        content,
      });

      if (pendingUploads.length > 0 && postId) {
        const uploadResults = await uploadAll();

        if (uploadResults.length > 0) {
          await createAttachmentsBatch({
            postId,
            attachments: uploadResults.map(r => ({
              storageId: r.storageId as Id<'_storage'>,
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
      {/* Header */}
      <View className='flex-row items-center justify-between border-b border-border px-4 py-3'>
        <BackButton />
        <Text className='text-lg font-semibold text-foreground'>New Post</Text>
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

      {/* Title input */}
      <View className='px-4 pt-4'>
        <Input
          placeholder='Post title'
          value={title}
          onChangeText={setTitle}
          className='border-0 px-0 text-xl font-bold'
        />
      </View>

      {/* Rich text editor */}
      <View className='flex-1 px-4 pt-2'>
        <RichTextEditor
          placeholder="What's on your mind?"
          onChange={handleContentChange}
        />
      </View>

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
                file.height,
                file.size
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
    </SafeAreaView>
  );
}
