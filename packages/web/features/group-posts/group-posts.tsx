'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GroupConfirmedAction } from '@/components/organisms/group-confirmed-action';
import { useGroup } from '@/hooks/convex/use-groups';
import * as hooks from '@/hooks/convex/use-group-posts';
function failure(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Unable to save this post. Please try again.';
}
export function GroupPosts({ groupId }: { groupId: Id<'groups'> }) {
  const group = useGroup(groupId);
  const [cursor, setCursor] = useState<string | null>(null);
  const eligible =
    group && group.joiningQuestionnaire?.canAccessMemberContent !== false;
  const posts = hooks.useGroupPosts(
    eligible ? { groupId, paginationOpts: { numItems: 20, cursor } } : 'skip'
  );
  if (group === undefined) return <p role='status'>Loading Group…</p>;
  if (!eligible)
    return (
      <p>
        Current Group membership and completed required onboarding are needed to
        view posts.
      </p>
    );
  return (
    <section aria-labelledby='group-posts-heading' className='space-y-4'>
      <h2 id='group-posts-heading' className='font-heading text-2xl font-bold'>
        Posts
      </h2>
      {posts === undefined ? (
        <p role='status'>Loading posts…</p>
      ) : (
        <>
          {!posts.page.length && <p>No posts yet.</p>}
          {posts.page.map(post => (
            <article
              key={post._id}
              className='space-y-2 rounded-card border border-border p-4'
            >
              <Link
                className='font-heading text-lg font-semibold text-primary underline'
                href={`/groups/${groupId}/posts/${post._id}`}
              >
                {post.title}
              </Link>
              <p className='text-sm text-muted-foreground'>
                {post.authorName} · {new Date(post.createdAt).toLocaleString()}
              </p>
              <p className='line-clamp-3 whitespace-pre-wrap break-words'>
                {post.content}
              </p>
            </article>
          ))}
          {!posts.isDone && (
            <Button
              variant='outline'
              onClick={() => setCursor(posts.continueCursor)}
            >
              Next posts
            </Button>
          )}
          {cursor && (
            <Button variant='ghost' onClick={() => setCursor(null)}>
              Newest posts
            </Button>
          )}
        </>
      )}
    </section>
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
  const router = useRouter();
  if (post === undefined) return <p role='status'>Loading post…</p>;
  if (!post || post.groupId !== groupId)
    return <p role='alert'>Post unavailable.</p>;
  return (
    <main className='mx-auto max-w-3xl space-y-5 p-6'>
      <Button variant='ghost' asChild>
        <Link href={`/groups/${groupId}`}>Back to Group</Link>
      </Button>
      <h1 className='break-words font-heading text-3xl font-bold'>
        {post.title}
      </h1>
      <p className='text-sm text-muted-foreground'>
        {post.authorName} · {new Date(post.createdAt).toLocaleString()}
      </p>
      <p className='whitespace-pre-wrap break-words'>{post.content}</p>
      {post.canEdit && (
        <Button variant='outline' asChild>
          <Link href={`/groups/${groupId}/posts/${postId}/edit`}>
            Edit post
          </Link>
        </Button>
      )}
      {post.canDelete && (
        <GroupConfirmedAction
          label='Delete post'
          confirmation='Confirm deleting post'
          explanation='This permanently deletes this Group post.'
          onConfirm={async () => {
            await remove({ postId });
            router.push(`/groups/${groupId}`);
          }}
        />
      )}
      <PostReplies postId={postId} />
    </main>
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
    return <p role='status'>Loading post editor…</p>;
  if (
    !group ||
    group.joiningQuestionnaire?.canAccessMemberContent === false ||
    (postId && (!post || post.groupId !== groupId || !post.canEdit))
  )
    return <p role='alert'>Post creation or editing is unavailable.</p>;
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
  const router = useRouter();
  return (
    <main className='mx-auto max-w-3xl space-y-5 p-6'>
      <h1 className='font-heading text-2xl font-bold'>
        {postId ? 'Edit post' : 'New post'}
      </h1>
      <form
        className='space-y-4'
        onSubmit={async e => {
          e.preventDefault();
          setPending(true);
          setError('');
          try {
            const id = postId
              ? (await update({ postId, title, content }), postId)
              : await create({ groupId, title, content });
            router.push(`/groups/${groupId}/posts/${id}`);
          } catch (e) {
            setError(failure(e));
          } finally {
            setPending(false);
          }
        }}
      >
        <div className='space-y-2'>
          <Label htmlFor='group-post-title'>Title</Label>
          <Input
            id='group-post-title'
            value={title}
            maxLength={200}
            required
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='group-post-content'>Post</Label>
          <Textarea
            id='group-post-content'
            value={content}
            maxLength={50000}
            required
            rows={10}
            onChange={e => setContent(e.target.value)}
          />
        </div>
        <div className='flex flex-wrap gap-3'>
          <Button
            disabled={pending || !title.trim() || !content.trim()}
            type='submit'
          >
            {pending ? 'Saving…' : postId ? 'Save post' : 'Publish post'}
          </Button>
          <Button
            variant='outline'
            type='button'
            disabled={pending}
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
        {error && <p role='alert'>{error}</p>}
      </form>
    </main>
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
    <section
      aria-labelledby='group-post-replies-heading'
      className='space-y-4 border-t border-border pt-5'
    >
      <h2
        id='group-post-replies-heading'
        className='font-heading text-xl font-semibold'
      >
        Replies
      </h2>
      {replies === undefined ? (
        <p role='status'>Loading replies…</p>
      ) : (
        <>
          {!replies.page.length && <p>No replies yet.</p>}
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
              onClick={() => setCursor(replies.continueCursor)}
            >
              Next replies
            </Button>
          )}
          {cursor && (
            <Button variant='ghost' onClick={() => setCursor(null)}>
              First replies
            </Button>
          )}
        </>
      )}
      <form
        className='space-y-2'
        onSubmit={async e => {
          e.preventDefault();
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
        <Label htmlFor='group-post-reply'>Reply</Label>
        <Textarea
          id='group-post-reply'
          value={content}
          onChange={e => setContent(e.target.value)}
          maxLength={50000}
          required
        />
        <Button type='submit' disabled={pending || !content.trim()}>
          {pending ? 'Sending…' : 'Send reply'}
        </Button>
        {error && <p role='alert'>{error}</p>}
      </form>
    </section>
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
    <article className='space-y-2 rounded-card border border-border p-4'>
      <p className='text-sm text-muted-foreground'>{authorName}</p>
      {editing ? (
        <form
          className='space-y-2'
          onSubmit={async e => {
            e.preventDefault();
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
          <Label htmlFor={`reply-${replyId}`}>Edit reply</Label>
          <Textarea
            id={`reply-${replyId}`}
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={50000}
            required
          />
          <div className='flex gap-2'>
            <Button disabled={pending || !text.trim()} type='submit'>
              Save reply
            </Button>
            <Button
              disabled={pending}
              type='button'
              variant='outline'
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <p className='whitespace-pre-wrap break-words'>{content}</p>
      )}
      {canEdit && (
        <div className='flex flex-wrap gap-2'>
          <Button
            variant='outline'
            onClick={() => {
              setText(content);
              setEditing(true);
            }}
          >
            Edit reply
          </Button>
          <GroupConfirmedAction
            label='Delete reply'
            confirmation='Confirm deleting reply'
            explanation='This permanently deletes this reply.'
            onConfirm={() => remove({ replyId })}
          />
        </div>
      )}
      {error && <p role='alert'>{error}</p>}
    </article>
  );
}
