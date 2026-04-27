import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';

import { useGlobalUser } from '@/context/global-user-context';
import {
  usePostDetail,
  useCreateReply,
  useDeletePost,
  useDeleteReply,
  useUpdateReply,
} from '@/hooks/use-posts';
import {
  usePostPresence,
  useTypingState,
  useTypingIndicators,
} from '@/hooks/use-presence';
import { useTogglePostMute } from '@/hooks/use-muting';
import { useCreateReport } from '@/hooks/use-reports';
import { useAttachments } from '@/hooks/use-file-upload';
import { UserAvatar as Avatar } from '@/components/ui/user-avatar';
import { BackButton } from '@/components/ui/back-button';
import {
  useActionMenu,
  type ActionMenuOption,
} from '@/components/ui/action-menu';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { AttachmentGallery } from '@/components/attachments/attachment-gallery';
import { AttachmentButton } from '@/components/attachments/attachment-button';
import { AttachmentPreview } from '@/components/attachments/attachment-preview';
import { TypingIndicator } from '@/components/posts/typing-indicator';
import { HtmlContent } from '@/components/posts/html-content';
import { formatTimeAgo, LoadingState } from '@/components/molecules';
import { toast } from '@groupi/shared/platform';
import { router } from 'expo-router';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{
    eventId: string;
    postId: string;
  }>();
  const { person } = useGlobalUser();
  const postDetail = usePostDetail(postId as never);
  const createReply = useCreateReply();
  const deletePost = useDeletePost();
  const deleteReply = useDeleteReply();
  const updateReply = useUpdateReply();
  const togglePostMute = useTogglePostMute();
  const createReport = useCreateReport();
  const { showActionMenu } = useActionMenu();
  const createAttachmentsBatch = useMutation(
    api.attachments.mutations.createAttachmentsBatch
  );

  // Presence & typing
  const { roomToken } = usePostPresence(postId);
  const { setTyping } = useTypingState(postId);
  const allTypingUsers = useTypingIndicators(roomToken ?? undefined);
  const currentPersonId = person?._id;
  const typingUsers = useMemo(
    () =>
      allTypingUsers.filter(
        (u: { personId: string }) => u.personId !== currentPersonId
      ),
    [allTypingUsers, currentPersonId]
  );

  // Clear typing on unmount
  useEffect(() => {
    return () => setTyping(false);
  }, [setTyping]);

  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editingReplyText, setEditingReplyText] = useState('');

  const handleReplyTextChange = useCallback(
    (text: string) => {
      setReplyText(text);
      setTyping(text.trim().length > 0);
    },
    [setTyping]
  );

  const {
    pendingUploads,
    isUploading,
    addFile,
    removeFile,
    uploadAll,
    clearAll,
  } = useAttachments();

  if (postDetail === undefined) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-row items-center px-4 py-3'>
          <BackButton />
          <Text className='text-lg font-semibold text-foreground'>Post</Text>
        </View>
        <LoadingState />
      </SafeAreaView>
    );
  }

  const post = postDetail?.post ?? postDetail;
  const replies = postDetail?.replies ?? [];
  const postAttachments = postDetail?.attachments ?? post?.attachments ?? [];
  const authorName =
    post?.author?.user?.name ?? post?.author?.person?.user?.name ?? 'Unknown';
  const authorImage =
    post?.author?.user?.image ?? post?.author?.person?.user?.image ?? undefined;
  const isAuthor = person?._id && post?.author?.person?._id === person._id;

  async function handleSubmitReply() {
    if (!replyText.trim()) return;
    setTyping(false);
    setIsSubmittingReply(true);
    try {
      const replyId = await createReply({ postId, text: replyText.trim() });

      // Upload and attach files to the reply
      if (pendingUploads.length > 0 && replyId) {
        const uploadResults = await uploadAll();
        if (uploadResults.length > 0) {
          await createAttachmentsBatch({
            replyId,
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
      setReplyText('');
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setIsSubmittingReply(false);
    }
  }

  function handlePostActions() {
    const options: ActionMenuOption[] = [];

    if (isAuthor) {
      options.push({
        label: 'Edit Post',
        icon: 'create-outline',
        onPress: () => {
          const { eventId } = post;
          router.push(`/event/${eventId}/post/${postId}/edit`);
        },
      });
      options.push({
        label: 'Delete Post',
        icon: 'trash-outline',
        destructive: true,
        onPress: () => {
          showConfirmDialog({
            title: 'Delete Post',
            message: 'This will also delete all replies. Are you sure?',
            confirmLabel: 'Delete',
            destructive: true,
            onConfirm: async () => {
              try {
                await deletePost({ postId });
                toast.success('Post deleted');
                router.back();
              } catch {
                toast.error('Failed to delete post');
              }
            },
          });
        },
      });
    }

    // Always available actions
    options.push({
      label: 'Mute Post',
      icon: 'notifications-off-outline',
      onPress: () => togglePostMute(postId),
    });

    if (!isAuthor) {
      options.push({
        label: 'Report Post',
        icon: 'flag-outline',
        onPress: () =>
          createReport({
            targetType: 'POST',
            targetId: postId,
            reason: 'INAPPROPRIATE_CONTENT',
          }),
      });
    }

    showActionMenu({ title: 'Post Options', options });
  }

  async function handleSaveEditReply() {
    if (!editingReplyId || !editingReplyText.trim()) return;
    try {
      await updateReply({
        replyId: editingReplyId,
        text: editingReplyText.trim(),
      });
      setEditingReplyId(null);
      setEditingReplyText('');
      toast.success('Reply updated');
    } catch {
      toast.error('Failed to update reply');
    }
  }

  function handleReplyActions(
    replyId: string,
    isReplyAuthor: boolean,
    replyContent: string
  ) {
    if (!isReplyAuthor) return;

    showActionMenu({
      options: [
        {
          label: 'Edit Reply',
          icon: 'create-outline',
          onPress: () => {
            setEditingReplyId(replyId);
            setEditingReplyText(replyContent);
          },
        },
        {
          label: 'Delete Reply',
          icon: 'trash-outline',
          destructive: true,
          onPress: () => {
            showConfirmDialog({
              title: 'Delete Reply',
              message: 'Are you sure?',
              confirmLabel: 'Delete',
              destructive: true,
              onConfirm: async () => {
                try {
                  await deleteReply({ replyId });
                  toast.success('Reply deleted');
                } catch {
                  toast.error('Failed to delete reply');
                }
              },
            });
          },
        },
      ],
    });
  }

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <KeyboardAvoidingView
        className='flex-1'
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View className='flex-row items-center justify-between border-b border-border px-4 py-3'>
          <View className='flex-row items-center'>
            <BackButton />
            <Text className='text-lg font-semibold text-foreground'>Post</Text>
          </View>
          {post ? (
            <Pressable onPress={handlePostActions} className='p-2'>
              <Ionicons name='ellipsis-horizontal' size={20} color='#6b7280' />
            </Pressable>
          ) : null}
        </View>

        {/* Content */}
        <FlatList
          data={replies}
          keyExtractor={(item: { _id: string }) => item._id}
          ListHeaderComponent={
            <View className='border-b border-border px-4 pb-4 pt-4'>
              {/* Author */}
              <View className='flex-row items-center gap-2'>
                <Avatar src={authorImage} name={authorName} size='md' />
                <View>
                  <Text className='text-base font-medium text-foreground'>
                    {authorName}
                  </Text>
                  <Text className='text-xs text-muted-foreground'>
                    {formatTimeAgo(post._creationTime)}
                  </Text>
                </View>
              </View>

              {/* Post content */}
              <View className='mt-3 flex-row items-center gap-2'>
                <Text className='text-xl font-bold text-foreground'>
                  {post.title}
                </Text>
                {post.updatedAt && post.updatedAt !== post._creationTime ? (
                  <Text className='text-xs text-muted-foreground'>
                    (edited)
                  </Text>
                ) : null}
              </View>
              <HtmlContent html={post.content} className='mt-2' />

              {/* Post attachments */}
              {postAttachments.length > 0 ? (
                <AttachmentGallery attachments={postAttachments} />
              ) : null}

              {/* Reply count */}
              <View className='mt-4 flex-row items-center gap-1'>
                <Ionicons name='chatbubble-outline' size={16} color='#9ca3af' />
                <Text className='text-sm text-muted-foreground'>
                  {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                </Text>
              </View>
            </View>
          }
          renderItem={({
            item,
          }: {
            item: {
              _id: string;
              text?: string;
              content?: string;
              _creationTime: number;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              attachments?: any[];
              author?: {
                person?: {
                  _id: string;
                  user?: { name: string; image?: string };
                };
                user?: { name: string; image?: string };
              };
            };
          }) => {
            const replyAuthorName =
              item.author?.user?.name ??
              item.author?.person?.user?.name ??
              'Unknown';
            const replyAuthorImage =
              item.author?.user?.image ??
              item.author?.person?.user?.image ??
              undefined;
            const isReplyAuthor =
              person?._id && item.author?.person?._id === person._id;
            const replyAttachments = item.attachments ?? [];

            const isEditing = editingReplyId === item._id;
            const replyContent = item.text ?? item.content ?? '';

            return (
              <Pressable
                onLongPress={() =>
                  handleReplyActions(item._id, !!isReplyAuthor, replyContent)
                }
                className='border-b border-border px-4 py-3'
              >
                <View className='flex-row items-start gap-2'>
                  <Avatar
                    src={replyAuthorImage}
                    name={replyAuthorName}
                    size='sm'
                  />
                  <View className='flex-1'>
                    <View className='flex-row items-center gap-2'>
                      <Text className='text-sm font-medium text-foreground'>
                        {replyAuthorName}
                      </Text>
                      <Text className='text-xs text-muted-foreground'>
                        {formatTimeAgo(item._creationTime)}
                      </Text>
                    </View>
                    {isEditing ? (
                      <View className='mt-1'>
                        <TextInput
                          className='rounded-input border border-primary bg-background px-3 py-2 text-base text-foreground'
                          value={editingReplyText}
                          onChangeText={setEditingReplyText}
                          multiline
                          autoFocus
                        />
                        <View className='mt-2 flex-row gap-2'>
                          <Pressable
                            onPress={handleSaveEditReply}
                            className='rounded-button bg-primary px-3 py-1.5'
                          >
                            <Text className='text-xs font-medium text-primary-foreground'>
                              Save
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              setEditingReplyId(null);
                              setEditingReplyText('');
                            }}
                            className='rounded-button border border-border px-3 py-1.5'
                          >
                            <Text className='text-xs font-medium text-muted-foreground'>
                              Cancel
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <Text className='mt-1 text-base text-foreground'>
                        {replyContent}
                      </Text>
                    )}
                    {replyAttachments.length > 0 ? (
                      <AttachmentGallery attachments={replyAttachments} />
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          }}
          contentContainerClassName='pb-4'
        />

        {/* Typing indicator */}
        <TypingIndicator typingUsers={typingUsers} />

        {/* Attachment preview for reply */}
        <AttachmentPreview uploads={pendingUploads} onRemove={removeFile} />

        {/* Reply input */}
        <View className='flex-row items-end gap-2 border-t border-border px-2 py-2'>
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
            disabled={isSubmittingReply || isUploading}
          />
          <TextInput
            className='min-h-[40px] flex-1 rounded-input border border-border bg-background px-3 py-2 text-base text-foreground'
            placeholder='Write a reply...'
            placeholderTextColor='#9ca3af'
            value={replyText}
            onChangeText={handleReplyTextChange}
            multiline
          />
          <Pressable
            onPress={handleSubmitReply}
            disabled={
              (!replyText.trim() && pendingUploads.length === 0) ||
              isSubmittingReply ||
              isUploading
            }
            className={`h-10 w-10 items-center justify-center rounded-full ${
              (replyText.trim() || pendingUploads.length > 0) &&
              !isSubmittingReply &&
              !isUploading
                ? 'bg-primary'
                : 'bg-muted'
            }`}
          >
            {isSubmittingReply || isUploading ? (
              <ActivityIndicator size='small' color='#ffffff' />
            ) : (
              <Ionicons
                name='send'
                size={18}
                color={
                  replyText.trim() || pendingUploads.length > 0
                    ? '#ffffff'
                    : '#9ca3af'
                }
              />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
