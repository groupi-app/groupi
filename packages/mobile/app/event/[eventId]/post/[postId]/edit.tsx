import { useState, useEffect, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { useLocalSearchParams, router } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';

import { BackButton } from '@/components/ui/back-button';
import { LoadingState } from '@/components/molecules';
import { EmptyState } from '@/components/ui/empty-state';
import { PostComposerKeyboardView } from '@/components/posts/post-composer-keyboard-view';
import { PostTitleInput } from '@/components/posts/post-title-input';
import { RichTextEditor } from '@/components/posts/rich-text-editor';
import { AttachmentButton } from '@/components/attachments/attachment-button';
import {
  AttachmentEditList,
  type EditableAttachment,
} from '@/components/attachments/attachment-edit-list';
import { AttachmentPreview } from '@/components/attachments/attachment-preview';
import { usePostDetail, useUpdatePost } from '@/hooks/use-posts';
import { useAttachments } from '@/hooks/use-file-upload';
import { useGlobalUser } from '@/context/global-user-context';
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

export default function EditPostScreen() {
  const { postId } = useLocalSearchParams<{
    eventId: string;
    postId: string;
  }>();
  const typedPostId = postId as Id<'posts'>;
  const postDetail = usePostDetail(typedPostId);
  const updatePost = useUpdatePost();
  const { person } = useGlobalUser();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [attachmentIdsToDelete, setAttachmentIdsToDelete] = useState<
    Set<string>
  >(new Set());
  const {
    pendingUploads,
    isUploading,
    addFile,
    removeFile,
    uploadAll,
    clearAll,
  } = useAttachments();

  const post = postDetail?.post;

  useEffect(() => {
    if (post && !initialized) {
      setTitle(post.title ?? '');
      setContent(post.content ?? '');
      setInitialized(true);
    }
  }, [post, initialized]);

  const handleContentChange = useCallback((html: string) => {
    setContent(html);
  }, []);

  const hasChanges =
    initialized &&
    (title.trim() !== (post?.title ?? '') ||
      content !== (post?.content ?? '') ||
      attachmentIdsToDelete.size > 0 ||
      pendingUploads.length > 0);

  const allowNextNavigation = useUnsavedChanges(hasChanges);

  if (postDetail === undefined) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-row items-center px-4 py-3'>
          <BackButton />
          <Text className='text-lg font-semibold text-foreground'>
            Edit Post
          </Text>
        </View>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-row items-center px-4 py-3'>
          <BackButton />
          <Text className='text-lg font-semibold text-foreground'>
            Edit Post
          </Text>
        </View>
        <EmptyState
          icon='chatbubble-ellipses-outline'
          title='Post not found'
          description='This post may have been deleted or you may no longer have permission to edit it.'
        />
      </SafeAreaView>
    );
  }

  const isAuthor = post.author?.person?._id === person?._id;
  const role = postDetail.userMembership?.role;
  const canEdit = isAuthor || role === 'ORGANIZER' || role === 'MODERATOR';

  if (!canEdit) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-row items-center px-4 py-3'>
          <BackButton />
          <Text className='text-lg font-semibold text-foreground'>
            Edit Post
          </Text>
        </View>
        <EmptyState
          icon='lock-closed-outline'
          title='Editing unavailable'
          description="You don't have permission to edit this post."
        />
      </SafeAreaView>
    );
  }

  const isValid = title.trim().length > 0 && hasContent(content);

  async function handleSubmit() {
    if (!isValid || !hasChanges) return;

    setIsSubmitting(true);
    try {
      await createAfterUploading({
        expectedUploadCount: pendingUploads.length,
        uploadAll,
        create: attachments =>
          updatePost({
            postId: typedPostId,
            title: title.trim(),
            content,
            attachmentsToAdd: attachments.map(result => ({
              storageId: result.storageId as Id<'_storage'>,
              filename: result.filename,
              size: result.size,
              mimeType: result.mimeType,
              width: result.width,
              height: result.height,
            })),
            attachmentIdsToDelete: [
              ...attachmentIdsToDelete,
            ] as Id<'attachments'>[],
          }),
      });
      clearAll();
      toast.success('Post updated!');
      allowNextNavigation();
      router.back();
    } catch {
      toast.error('Failed to update post');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className='flex-1 bg-background'>
      {/* Header */}
      <View className='flex-row items-center justify-between border-b border-border px-4 py-3'>
        <BackButton />
        <Text className='text-lg font-semibold text-foreground'>Edit Post</Text>
        <Pressable
          onPress={handleSubmit}
          disabled={!isValid || !hasChanges || isSubmitting || isUploading}
          className={`rounded-button px-4 py-2 ${isValid && hasChanges && !isSubmitting ? 'bg-primary' : 'bg-muted'}`}
        >
          <Text
            className={`text-sm font-semibold ${isValid && hasChanges && !isSubmitting ? 'text-primary-foreground' : 'text-muted-foreground'}`}
          >
            {isUploading ? 'Uploading...' : isSubmitting ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <PostComposerKeyboardView>
        {/* Title input */}
        <View className='px-4 pt-4'>
          <PostTitleInput value={title} onChangeText={setTitle} />
        </View>

        {/* Rich text editor — only mount once we have initial content */}
        <View className='flex-1 px-4 pt-2'>
          {initialized ? (
            <RichTextEditor
              initialContent={post?.content ?? ''}
              placeholder="What's on your mind?"
              onChange={handleContentChange}
            />
          ) : (
            <LoadingState message='Loading content...' />
          )}
        </View>

        <AttachmentEditList
          attachments={(post.attachments ?? []).filter(
            (attachment: EditableAttachment) =>
              !attachmentIdsToDelete.has(attachment._id)
          )}
          onRemove={attachmentId =>
            setAttachmentIdsToDelete(previous =>
              new Set(previous).add(attachmentId)
            )
          }
        />
        <AttachmentPreview uploads={pendingUploads} onRemove={removeFile} />
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
            currentCount={
              (post.attachments?.length ?? 0) -
              attachmentIdsToDelete.size +
              pendingUploads.length
            }
            disabled={isSubmitting || isUploading}
            showLabel
          />
        </View>
      </PostComposerKeyboardView>
    </SafeAreaView>
  );
}
