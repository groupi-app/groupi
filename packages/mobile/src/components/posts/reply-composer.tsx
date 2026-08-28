import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Id } from 'convex/_generated/dataModel';
import { useCSSVariable } from 'uniwind';

import { AttachmentButton } from '@/components/attachments/attachment-button';
import { AttachmentPreview } from '@/components/attachments/attachment-preview';
import { Text } from '@/components/ui/text';
import { useAttachments } from '@/hooks/use-file-upload';
import { useCreateReply } from '@/hooks/use-posts';
import { toast } from '@groupi/shared/platform';
import { createAfterUploading } from '@groupi/shared/utils';
import { hasRichTextContent, toRichTextHtml } from './html-content';
import { RichTextEditor } from './rich-text-editor';

export const MAX_REPLY_LENGTH = 5000;
export const REPLY_EDITOR_HEIGHT = 76;

interface ReplyComposerProps {
  postId: Id<'posts'>;
  onTypingChange: (isTyping: boolean) => void;
}

export function ReplyComposer({ postId, onTypingChange }: ReplyComposerProps) {
  const createReply = useCreateReply();
  const [content, setContent] = useState('');
  const [editorKey, setEditorKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const primaryForegroundColor = String(
    useCSSVariable('--color-primary-foreground') ?? ''
  );
  const mutedForegroundColor = String(
    useCSSVariable('--color-muted-foreground') ?? ''
  );
  const {
    pendingUploads,
    isUploading,
    addFile,
    removeFile,
    uploadAll,
    clearAll,
  } = useAttachments();

  const hasText = hasRichTextContent(content);
  const isTooLong = content.length > MAX_REPLY_LENGTH;
  const isBusy = isSubmitting || isUploading;
  const canSubmit = (hasText || pendingUploads.length > 0) && !isTooLong;

  const handleContentChange = useCallback(
    (nextContent: string) => {
      setContent(nextContent);
      onTypingChange(hasRichTextContent(nextContent));
    },
    [onTypingChange]
  );

  async function handleSubmit() {
    if (!canSubmit || isBusy) {
      if (isTooLong) {
        toast.error('Replies must be 5000 characters or less');
      }
      return;
    }

    onTypingChange(false);
    setIsSubmitting(true);
    try {
      await createAfterUploading({
        expectedUploadCount: pendingUploads.length,
        uploadAll,
        create: attachments =>
          createReply({
            postId,
            text: hasText ? content.trim() : '',
            attachments: attachments.map(result => ({
              storageId: result.storageId as Id<'_storage'>,
              filename: result.filename,
              size: result.size,
              mimeType: result.mimeType,
              width: result.width,
              height: result.height,
            })),
          }),
      });

      clearAll();
      setContent('');
      setEditorKey(previous => previous + 1);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to send reply'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View>
      <AttachmentPreview uploads={pendingUploads} onRemove={removeFile} />
      <View className='border-t border-border px-2 py-2'>
        {isTooLong ? (
          <Text className='mb-1 text-xs text-error'>
            Reply must be 5000 characters or less
          </Text>
        ) : null}
        <View className='flex-row items-end gap-2'>
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
            disabled={isBusy}
          />
          <RichTextEditor
            key={editorKey}
            initialContent={toRichTextHtml(content)}
            placeholder='Write a reply...'
            onChange={handleContentChange}
            variant='compact'
            minHeight={REPLY_EDITOR_HEIGHT}
            accessibilityLabel='Write a reply'
          />
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit || isBusy}
            className={`h-11 w-11 items-center justify-center rounded-full ${canSubmit && !isBusy ? 'bg-primary' : 'bg-muted'}`}
            accessibilityRole='button'
            accessibilityLabel='Send reply'
            accessibilityState={{
              disabled: !canSubmit || isBusy,
              busy: isBusy,
            }}
          >
            {isBusy ? (
              <ActivityIndicator
                size='small'
                colorClassName='accent-primary-foreground'
              />
            ) : (
              <Ionicons
                name='send'
                size={18}
                color={
                  canSubmit ? primaryForegroundColor : mutedForegroundColor
                }
              />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
