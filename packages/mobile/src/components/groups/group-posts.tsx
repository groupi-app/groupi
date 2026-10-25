import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { useGroup } from '@/hooks/use-groups';
import * as hooks from '@/hooks/use-group-posts';
function failure(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Unable to save the post. Please try again.';
}
export function GroupPosts({ groupId }: { groupId: Id<'groups'> }) {
  const group = useGroup(groupId);
  const [cursor, setCursor] = useState<string | null>(null);
  const eligible =
    group && group.joiningQuestionnaire?.canAccessMemberContent !== false;
  const posts = hooks.useGroupPosts(
    eligible ? { groupId, paginationOpts: { numItems: 20, cursor } } : 'skip'
  );
  if (group === undefined) return <Text>Loading Group…</Text>;
  if (!eligible)
    return (
      <Text>
        Current Group membership and completed required onboarding are needed to
        view posts.
      </Text>
    );
  return (
    <View className='gap-4'>
      <Text
        accessibilityRole='header'
        className='font-heading text-2xl font-bold'
      >
        Posts
      </Text>
      {posts === undefined ? (
        <Text>Loading posts…</Text>
      ) : (
        <>
          {!posts.page.length && <Text>No posts yet.</Text>}
          {posts.page.map(post => (
            <View
              key={post._id}
              className='gap-2 rounded-card border border-border p-4'
            >
              <Button
                variant='link'
                accessibilityLabel={`Open post: ${post.title}`}
                onPress={() =>
                  router.push(`/groups/${groupId}/posts/${post._id}`)
                }
              >
                <Text className='font-semibold text-primary'>{post.title}</Text>
              </Button>
              <Text className='text-sm text-muted-foreground'>
                {post.authorName} · {new Date(post.createdAt).toLocaleString()}
              </Text>
              <Text numberOfLines={3}>{post.content}</Text>
            </View>
          ))}
          {!posts.isDone && (
            <Button
              variant='outline'
              onPress={() => setCursor(posts.continueCursor)}
            >
              <Text>Next posts</Text>
            </Button>
          )}
          {cursor && (
            <Button variant='ghost' onPress={() => setCursor(null)}>
              <Text>Newest posts</Text>
            </Button>
          )}
        </>
      )}
    </View>
  );
}
export function GroupPostDetail({
  groupId,
  postId,
}: {
  groupId: Id<'groups'>;
  postId: Id<'groupPosts'>;
}) {
  const post = hooks.useGroupPost({ postId });
  const remove = hooks.useDeleteGroupPost();
  const [error, setError] = useState('');
  if (post === undefined) return <Text>Loading post…</Text>;
  if (!post || post.groupId !== groupId)
    return <Text accessibilityRole='alert'>Post unavailable.</Text>;
  return (
    <View className='gap-4'>
      <Text
        accessibilityRole='header'
        className='font-heading text-2xl font-bold'
      >
        {post.title}
      </Text>
      <Text className='text-sm text-muted-foreground'>
        {post.authorName} · {new Date(post.createdAt).toLocaleString()}
      </Text>
      <Text>{post.content}</Text>
      {post.canEdit && (
        <Button
          variant='outline'
          onPress={() => router.push(`/groups/${groupId}/posts/${postId}/edit`)}
        >
          <Text>Edit post</Text>
        </Button>
      )}
      {post.canDelete && (
        <Button
          variant='destructive'
          onPress={() =>
            showConfirmDialog({
              title: 'Delete post?',
              message: 'This permanently deletes this Group post.',
              confirmLabel: 'Delete post',
              destructive: true,
              onConfirm: async () => {
                try {
                  await remove({ postId });
                  router.replace(`/groups/${groupId}`);
                } catch (e) {
                  setError(failure(e));
                }
              },
            })
          }
        >
          <Text>Delete post</Text>
        </Button>
      )}
      {error && <Text accessibilityRole='alert'>{error}</Text>}
      <PostReplies postId={postId} />
    </View>
  );
}
export function GroupPostEditor({
  groupId,
  postId,
}: {
  groupId: Id<'groups'>;
  postId?: Id<'groupPosts'>;
}) {
  const group = useGroup(groupId);
  const post = hooks.useGroupPost(postId ? { postId } : 'skip');
  if (group === undefined || (postId && post === undefined))
    return <Text>Loading post editor…</Text>;
  if (
    !group ||
    group.joiningQuestionnaire?.canAccessMemberContent === false ||
    (postId && (!post || post.groupId !== groupId || !post.canEdit))
  )
    return (
      <Text accessibilityRole='alert'>
        Post creation or editing is unavailable.
      </Text>
    );
  return (
    <PostForm
      key={postId ?? 'new'}
      groupId={groupId}
      postId={postId}
      initialTitle={post?.title ?? ''}
      initialContent={post?.content ?? ''}
    />
  );
}
function PostForm({
  groupId,
  postId,
  initialTitle,
  initialContent,
}: {
  groupId: Id<'groups'>;
  postId?: Id<'groupPosts'>;
  initialTitle: string;
  initialContent: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const create = hooks.useCreateGroupPost();
  const update = hooks.useUpdateGroupPost();
  return (
    <View className='gap-4'>
      <Text nativeID='group-post-title-label'>Title</Text>
      <Input
        accessibilityLabel='Title'
        accessibilityLabelledBy='group-post-title-label'
        value={title}
        maxLength={200}
        editable={!pending}
        onChangeText={setTitle}
      />
      <Text nativeID='group-post-content-label'>Post</Text>
      <Input
        accessibilityLabel='Post'
        accessibilityLabelledBy='group-post-content-label'
        value={content}
        maxLength={50000}
        editable={!pending}
        onChangeText={setContent}
        multiline
        className='min-h-48'
        textAlignVertical='top'
      />
      <Button
        disabled={pending || !title.trim() || !content.trim()}
        onPress={async () => {
          setPending(true);
          setError('');
          try {
            const id = postId
              ? (await update({ postId, title, content }), postId)
              : await create({ groupId, title, content });
            router.replace(`/groups/${groupId}/posts/${id}`);
          } catch (e) {
            setError(failure(e));
          } finally {
            setPending(false);
          }
        }}
      >
        <Text>
          {pending ? 'Saving…' : postId ? 'Save post' : 'Publish post'}
        </Text>
      </Button>
      <Button
        variant='outline'
        disabled={pending}
        onPress={() => router.back()}
      >
        <Text>Cancel</Text>
      </Button>
      {error && <Text accessibilityRole='alert'>{error}</Text>}
    </View>
  );
}

function PostReplies({ postId }: { postId: Id<'groupPosts'> }) {
  const [cursor, setCursor] = useState<string | null>(null);
  const replies = hooks.useGroupPostReplies({
    postId,
    paginationOpts: { numItems: 20, cursor },
  });
  const create = hooks.useCreateGroupPostReply();
  const [content, setContent] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  return (
    <View className='gap-3 border-t border-border pt-4'>
      <Text
        accessibilityRole='header'
        className='font-heading text-xl font-semibold'
      >
        Replies
      </Text>
      {replies === undefined ? (
        <Text>Loading replies…</Text>
      ) : (
        <>
          {!replies.page.length && <Text>No replies yet.</Text>}
          {replies.page.map(reply => (
            <Reply
              key={reply._id}
              replyId={reply._id}
              content={reply.content}
              authorName={reply.authorName}
              canEdit={reply.canEdit}
            />
          ))}
          {!replies.isDone && (
            <Button
              variant='outline'
              onPress={() => setCursor(replies.continueCursor)}
            >
              <Text>Next replies</Text>
            </Button>
          )}
          {cursor && (
            <Button variant='ghost' onPress={() => setCursor(null)}>
              <Text>First replies</Text>
            </Button>
          )}
        </>
      )}
      <Input
        accessibilityLabel='Reply'
        value={content}
        onChangeText={setContent}
        maxLength={50000}
        multiline
        editable={!pending}
      />
      <Button
        disabled={pending || !content.trim()}
        onPress={async () => {
          setPending(true);
          setError('');
          try {
            await create({ postId, content });
            setContent('');
          } catch (e) {
            setError(failure(e));
          } finally {
            setPending(false);
          }
        }}
      >
        <Text>{pending ? 'Sending…' : 'Send reply'}</Text>
      </Button>
      {error && <Text accessibilityRole='alert'>{error}</Text>}
    </View>
  );
}
function Reply({
  replyId,
  content,
  authorName,
  canEdit,
}: {
  replyId: Id<'groupPostReplies'>;
  content: string;
  authorName: string;
  canEdit: boolean;
}) {
  const update = hooks.useUpdateGroupPostReply();
  const remove = hooks.useDeleteGroupPostReply();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(content);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  return (
    <View className='gap-2 rounded-card border border-border p-4'>
      <Text className='text-sm text-muted-foreground'>{authorName}</Text>
      {editing ? (
        <View className='gap-2'>
          <Input
            accessibilityLabel='Edit reply'
            value={text}
            onChangeText={setText}
            maxLength={50000}
            multiline
            editable={!pending}
          />
          <Button
            disabled={pending || !text.trim()}
            onPress={async () => {
              setPending(true);
              setError('');
              try {
                await update({ replyId, content: text });
                setEditing(false);
              } catch (e) {
                setError(failure(e));
              } finally {
                setPending(false);
              }
            }}
          >
            <Text>Save reply</Text>
          </Button>
          <Button
            disabled={pending}
            variant='outline'
            onPress={() => setEditing(false)}
          >
            <Text>Cancel</Text>
          </Button>
        </View>
      ) : (
        <Text>{content}</Text>
      )}
      {canEdit && (
        <View className='gap-2'>
          <Button
            variant='outline'
            onPress={() => {
              setText(content);
              setEditing(true);
            }}
          >
            <Text>Edit reply</Text>
          </Button>
          <Button
            variant='destructive'
            onPress={() =>
              showConfirmDialog({
                title: 'Delete reply?',
                message: 'This permanently deletes this reply.',
                confirmLabel: 'Delete reply',
                destructive: true,
                onConfirm: async () => {
                  try {
                    await remove({ replyId });
                  } catch (e) {
                    setError(failure(e));
                  }
                },
              })
            }
          >
            <Text>Delete reply</Text>
          </Button>
        </View>
      )}
      {error && <Text accessibilityRole='alert'>{error}</Text>}
    </View>
  );
}
