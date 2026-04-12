import { useState } from 'react';
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
} from '@/hooks/use-posts';
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
import { toast } from '@groupi/shared/platform';
import { router } from 'expo-router';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

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
  const { showActionMenu } = useActionMenu();
  const createAttachmentsBatch = useMutation(
    api.attachments.mutations.createAttachmentsBatch
  );

  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

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
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' />
        </View>
      </SafeAreaView>
    );
  }

  const post = postDetail?.post ?? postDetail;
  const replies = postDetail?.replies ?? [];
  const postAttachments = postDetail?.attachments ?? post?.attachments ?? [];
  const authorName = post?.author?.user?.name ?? 'Unknown';
  const authorImage = post?.author?.user?.image;
  const isAuthor = person?._id && post?.author?.person?._id === person._id;

  async function handleSubmitReply() {
    if (!replyText.trim()) return;
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

    if (options.length > 0) {
      showActionMenu({ title: 'Post Options', options });
    }
  }

  function handleReplyActions(replyId: string, isReplyAuthor: boolean) {
    if (!isReplyAuthor) return;

    showActionMenu({
      options: [
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
          {isAuthor ? (
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
              <Text className='mt-3 text-xl font-bold text-foreground'>
                {post.title}
              </Text>
              <Text className='mt-2 text-base leading-relaxed text-foreground'>
                {post.content}
              </Text>

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
                person?: { _id: string };
                user?: { name: string; image?: string };
              };
            };
          }) => {
            const replyAuthorName = item.author?.user?.name ?? 'Unknown';
            const replyAuthorImage = item.author?.user?.image;
            const isReplyAuthor =
              person?._id && item.author?.person?._id === person._id;
            const replyAttachments = item.attachments ?? [];

            return (
              <Pressable
                onLongPress={() =>
                  handleReplyActions(item._id, !!isReplyAuthor)
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
                    <Text className='mt-1 text-base text-foreground'>
                      {item.text ?? item.content}
                    </Text>
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
            onChangeText={setReplyText}
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
