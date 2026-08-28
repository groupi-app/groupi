import { useState, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { useLocalSearchParams, router } from 'expo-router';
import { useCSSVariable } from 'uniwind';
import type { Id } from 'convex/_generated/dataModel';

import { BackButton } from '@/components/ui/back-button';
import { AttachmentButton } from '@/components/attachments/attachment-button';
import { AttachmentPreview } from '@/components/attachments/attachment-preview';
import { PostComposerKeyboardView } from '@/components/posts/post-composer-keyboard-view';
import { PostTitleInput } from '@/components/posts/post-title-input';
import { RichTextEditor } from '@/components/posts/rich-text-editor';
import { useCreatePost } from '@/hooks/use-posts';
import { useAttachments } from '@/hooks/use-file-upload';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { toast } from '@groupi/shared/platform';
import { createAfterUploading } from '@groupi/shared/utils';

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
  const canSubmit = isValid && !isSubmitting && !isUploading;
  const postIconColor = String(
    useCSSVariable('--color-primary-foreground') ?? 'transparent'
  );
  const disabledIconColor = String(
    useCSSVariable('--color-muted-foreground') ?? 'transparent'
  );
  const hasChanges =
    title.trim().length > 0 || hasContent(content) || pendingUploads.length > 0;
  const allowNextNavigation = useUnsavedChanges(hasChanges);

  async function handleSubmit() {
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      await createAfterUploading({
        expectedUploadCount: pendingUploads.length,
        uploadAll,
        create: attachments =>
          createPost({
            eventId: eventId as Id<'events'>,
            title: title.trim(),
            content,
            attachments: attachments.map(r => ({
              storageId: r.storageId as Id<'_storage'>,
              filename: r.filename,
              size: r.size,
              mimeType: r.mimeType,
              width: r.width,
              height: r.height,
            })),
          }),
      });

      clearAll();
      toast.success('Post created!');
      allowNextNavigation();
      router.back();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create post'
      );
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
          disabled={!canSubmit}
          accessibilityRole='button'
          accessibilityLabel='Post'
          accessibilityState={{
            disabled: !canSubmit,
            busy: isSubmitting || isUploading,
          }}
          className={`flex-row items-center gap-1.5 rounded-button px-4 py-2 ${canSubmit ? 'bg-primary' : 'bg-muted'}`}
        >
          {!isUploading && !isSubmitting ? (
            <Ionicons
              name='paper-plane-outline'
              size={16}
              color={canSubmit ? postIconColor : disabledIconColor}
            />
          ) : null}
          <Text
            className={`text-sm font-semibold ${canSubmit ? 'text-primary-foreground' : 'text-muted-foreground'}`}
          >
            {isUploading
              ? 'Uploading...'
              : isSubmitting
                ? 'Posting...'
                : 'Post'}
          </Text>
        </Pressable>
      </View>

      <PostComposerKeyboardView>
        {/* Title input */}
        <View className='px-4 pt-4'>
          <PostTitleInput value={title} onChangeText={setTitle} />
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
            showLabel
          />
          {pendingUploads.length > 0 ? (
            <Text className='ml-2 text-sm text-muted-foreground'>
              {pendingUploads.length} file
              {pendingUploads.length === 1 ? '' : 's'} attached
            </Text>
          ) : null}
        </View>
      </PostComposerKeyboardView>
    </SafeAreaView>
  );
}
