import { useState, useEffect, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { useLocalSearchParams, router } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';

import { LabeledInput as Input } from '@/components/ui/labeled-input';
import { BackButton } from '@/components/ui/back-button';
import { LoadingState } from '@/components/molecules';
import { RichTextEditor } from '@/components/posts/rich-text-editor';
import { usePostDetail, useUpdatePost } from '@/hooks/use-posts';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { toast } from '@groupi/shared/platform';

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

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const post = postDetail?.post ?? postDetail;

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
    (title.trim() !== (post?.title ?? '') || content !== (post?.content ?? ''));

  useUnsavedChanges(hasChanges);

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

  const isValid = title.trim().length > 0 && hasContent(content);

  async function handleSubmit() {
    if (!isValid || !hasChanges) return;

    setIsSubmitting(true);
    try {
      await updatePost({
        postId: typedPostId,
        title: title.trim(),
        content,
      });
      toast.success('Post updated!');
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
          disabled={!isValid || !hasChanges || isSubmitting}
          className={`rounded-button px-4 py-2 ${isValid && hasChanges && !isSubmitting ? 'bg-primary' : 'bg-muted'}`}
        >
          <Text
            className={`text-sm font-semibold ${isValid && hasChanges && !isSubmitting ? 'text-primary-foreground' : 'text-muted-foreground'}`}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
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
    </SafeAreaView>
  );
}
