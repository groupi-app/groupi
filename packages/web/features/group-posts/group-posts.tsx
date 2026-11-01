'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Pin, MoreHorizontal } from 'lucide-react';
import { ActionMenu } from '@/components/ui/action-menu';
import { ActionMenuButton } from '@/components/ui/action-menu-button';
import { useActionMenu } from '@/hooks/use-action-menu';
import { usePinnedGroupPosts } from '@/hooks/convex/use-post-controls';
import {
  usePostStateActions,
  PostStateMenuItems,
  type PostState,
} from '@/features/discussion/post-state-actions';
import { GroupPollFeed } from '@/components/organisms/group-polls';
import { Button } from '@/components/ui/button';
import { GroupConfirmedAction } from '@/components/organisms/group-confirmed-action';
import { AttachmentGallery } from '@/components/attachments';
import { TypingIndicator } from '@/components/typing-indicator';
import { DiscussionComposer } from '@/features/discussion/composer';
import { DiscussionContent } from '@/features/discussion/content';
import { useGroup } from '@/hooks/convex/use-groups';
import { useIsActive } from '@/providers/visibility-provider';
import {
  useCurrentUserPostPresence,
  useCurrentUserTypingState,
  useTypingIndicators,
} from '@/hooks/convex/use-presence';
import * as hooks from '@/hooks/convex/use-group-posts';

export function GroupPosts({ groupId }: { groupId: Id<'groups'> }) {
  const group = useGroup(groupId);
  const [cursor, setCursor] = useState<string | null>(null);
  const eligible =
    group && group.joiningQuestionnaire?.canAccessMemberContent !== false;
  const posts = hooks.useGroupPosts(
    eligible
      ? {
          groupId,
          excludePinned: true,
          paginationOpts: { numItems: 20, cursor },
        }
      : 'skip'
  );
  const pinned = usePinnedGroupPosts(eligible ? { groupId } : 'skip');
  const pinnedIds = new Set((pinned ?? []).map(post => post._id));
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
      {pinned === undefined ? (
        <p role='status'>Loading pinned posts…</p>
      ) : (
        pinned.length > 0 && (
          <div aria-label='Pinned posts' className='space-y-3'>
            {[...pinned]
              .sort((a, b) => (b.pinnedAt ?? 0) - (a.pinnedAt ?? 0))
              .map(post => (
                <GroupPostCard key={post._id} post={post} groupId={groupId} />
              ))}
          </div>
        )
      )}
      <GroupPollFeed groupId={groupId} />
      {posts === undefined ? (
        <p role='status'>Loading posts…</p>
      ) : (
        <>
          {!posts.page.length && !pinned?.length && <p>No posts yet.</p>}
          {posts.page
            .filter(post => !pinnedIds.has(post._id))
            .map(post => (
              <GroupPostCard key={post._id} post={post} groupId={groupId} />
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
function GroupPostCard({
  post,
  groupId,
}: {
  post: NonNullable<ReturnType<typeof hooks.useGroupPosts>>['page'][number];
  groupId: Id<'groups'>;
}) {
  return (
    <article className='space-y-3 rounded-card border border-border p-4'>
      <div className='flex min-w-0 flex-wrap items-start justify-between gap-2'>
        <div className='min-w-0 flex-1 basis-40 space-y-2'>
          {post.pinnedAt !== undefined && (
            <p className='flex items-center gap-1 text-xs text-muted-foreground'>
              <Pin className='size-3' aria-hidden />
              Pinned
            </p>
          )}
          <Link
            className='break-words font-heading text-lg font-semibold text-primary underline'
            href={`/groups/${groupId}/posts/${post._id}`}
          >
            {post.title}
          </Link>
        </div>
        <GroupPostStateMenu post={post} />
      </div>
      <p className='break-words text-sm text-muted-foreground'>
        {post.authorName} · {new Date(post.createdAt).toLocaleString()}
      </p>
      <DiscussionContent content={post.content} preview />
      <AttachmentGallery attachments={post.attachments} />
      {post.unreadCount > 0 && (
        <p
          className='text-sm font-semibold text-primary'
          aria-label={`${post.unreadCount} unread notifications`}
        >
          Unread
        </p>
      )}
      <p className='text-sm text-muted-foreground'>
        {post.replyCount} {post.replyCount === 1 ? 'reply' : 'replies'}
        {post.repliesDisabled ? ' · Replies closed' : ''}
      </p>
    </article>
  );
}
function GroupPostStateMenu({ post }: { post: PostState }) {
  const menu = useActionMenu();
  const state = usePostStateActions(post, () => menu.setSheetOpen(false));
  if (!state.actions.length) return null;
  return (
    <div className='shrink-0'>
      <ActionMenu
        drawerTitle='Post actions'
        drawerContent={
          <div className='space-y-1 p-4'>
            <PostStateMenuItems state={state} menu='drawer' />
          </div>
        }
        contextMenuContent={<PostStateMenuItems state={state} menu='context' />}
        sheetOpen={menu.sheetOpen}
        onSheetOpenChange={menu.setSheetOpen}
        onContextMenu={menu.handleContextMenu}
        onClick={menu.handleClick}
      >
        <div>
          <ActionMenuButton
            label='Post actions'
            onClick={menu.handleMoreClick}
            onContextMenu={menu.handleContextMenu}
            dropdownContent={
              <PostStateMenuItems state={state} menu='dropdown' />
            }
          >
            <MoreHorizontal className='size-4' aria-hidden />
          </ActionMenuButton>
        </div>
      </ActionMenu>
      {state.error && !menu.sheetOpen && (
        <p role='alert' className='max-w-64 break-words text-sm text-error'>
          {state.error}
        </p>
      )}
    </div>
  );
}
export function GroupPostDetail({
  groupId,
  postId,
}: {
  groupId: Id<'groups'>;
  postId: Id<'posts'>;
}) {
  const post = hooks.useGroupPost({ postId });
  if (post === undefined) return <p role='status'>Loading post…</p>;
  if (!post || post.groupId !== groupId)
    return <p role='alert'>Post unavailable.</p>;
  return <PostThread key={postId} post={post} />;
}
function PostThread({
  post,
}: {
  post: NonNullable<ReturnType<typeof hooks.useGroupPost>>;
}) {
  const { groupId, _id: postId } = post;
  const remove = hooks.useDeleteGroupPost();
  const router = useRouter();
  const members = useQuery(api.groupPosts.queries.mentionMembers, { groupId });
  const muted = useQuery(api.muting.queries.isPostMuted, { postId });
  const toggleMute = useMutation(api.muting.mutations.togglePostMute);
  const markRead = useMutation(
    api.notifications.mutations.markPostNotificationsAsRead
  );
  const { roomToken } = useCurrentUserPostPresence(postId);
  const typing = useTypingIndicators(roomToken ?? undefined).filter(
    user => user.personId !== post.viewerPersonId
  );
  const [error, setError] = useState('');
  const isActive = useIsActive();
  useEffect(() => {
    if (!isActive) return;
    void markRead({ postId }).catch(() => {});
  }, [isActive, markRead, postId, post.replyCount]);
  return (
    <main className='mx-auto max-w-3xl space-y-5 p-6'>
      <Button variant='ghost' asChild>
        <Link href={`/groups/${groupId}`}>Back to Group</Link>
      </Button>
      <div className='flex min-w-0 flex-wrap items-start justify-between gap-2'>
        <h1 className='min-w-0 flex-1 basis-40 break-words font-heading text-3xl font-bold'>
          {post.title}
        </h1>
        <GroupPostStateMenu post={post} />
      </div>
      <p className='text-sm text-muted-foreground'>
        {post.authorName} · {new Date(post.createdAt).toLocaleString()}
      </p>
      <DiscussionContent content={post.content} members={members} />
      <AttachmentGallery attachments={post.attachments} />
      <div className='flex flex-wrap gap-2'>
        <Button
          variant='outline'
          disabled={muted === undefined}
          onClick={() => {
            void toggleMute({ postId }).catch(cause => setError(String(cause)));
          }}
        >
          {muted?.isMuted ? 'Unmute thread' : 'Mute thread'}
        </Button>
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
            explanation='This permanently deletes this post, replies, and attachments.'
            onConfirm={async () => {
              await remove({ postId });
              router.push(`/groups/${groupId}`);
            }}
          />
        )}
      </div>
      {error && <p role='alert'>{error}</p>}
      <TypingIndicator typingUsers={typing} />
      <PostReplies
        groupId={groupId}
        postId={postId}
        repliesDisabled={post.repliesDisabled ?? false}
      />
    </main>
  );
}
export function GroupPostEditor({
  groupId,
  postId,
}: {
  groupId: Id<'groups'>;
  postId?: Id<'posts'>;
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
    <PostEditorForm
      key={postId ?? groupId}
      groupId={groupId}
      post={postId ? post : undefined}
    />
  );
}
function PostEditorForm({
  groupId,
  post,
}: {
  groupId: Id<'groups'>;
  post: ReturnType<typeof hooks.useGroupPost>;
}) {
  const members = useQuery(api.groupPosts.queries.mentionMembers, { groupId });
  const create = hooks.useCreateGroupPost();
  const update = hooks.useUpdateGroupPost();
  const router = useRouter();
  return (
    <main className='mx-auto max-w-3xl space-y-5 p-6'>
      <h1 className='font-heading text-2xl font-bold'>
        {post ? 'Edit post' : 'New post'}
      </h1>
      <DiscussionComposer
        canConfigureReplies={!post}
        initialTitle={post?.title}
        initialContent={post?.content}
        existingAttachments={post?.attachments}
        mentionMembers={members}
        submitLabel={post ? 'Save post' : 'Publish post'}
        onCancel={() => router.back()}
        onSave={async ({
          title,
          content,
          attachments,
          attachmentIdsToDelete,
          repliesDisabled,
        }) => {
          const postId = post
            ? (await update({
                postId: post._id,
                title,
                content,
                attachmentsToAdd: attachments,
                attachmentIdsToDelete,
              }),
              post._id)
            : await create({
                groupId,
                title,
                content,
                attachments,
                repliesDisabled,
              });
          router.push(`/groups/${groupId}/posts/${postId}`);
        }}
      />
    </main>
  );
}
function PostReplies({
  groupId,
  postId,
  repliesDisabled,
}: {
  groupId: Id<'groups'>;
  postId: Id<'posts'>;
  repliesDisabled: boolean;
}) {
  const repliesClosed = useRef(repliesDisabled);
  useEffect(() => {
    repliesClosed.current = repliesDisabled;
  }, [repliesDisabled]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<Id<'replies'> | null>(
    null
  );
  const [newDraftDirty, setNewDraftDirty] = useState(false);
  const [newDraftVersion, setNewDraftVersion] = useState(0);
  const replies = hooks.useGroupPostReplies({
    postId,
    paginationOpts: { numItems: 20, cursor },
  });
  const members = useQuery(api.groupPosts.queries.mentionMembers, { groupId });
  const create = hooks.useCreateGroupPostReply();
  const { setTyping } = useCurrentUserTypingState(postId);
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
              reply={reply}
              groupId={groupId}
              editing={editingReplyId === reply._id}
              onEditingChange={editing =>
                setEditingReplyId(editing ? reply._id : null)
              }
              editDisabled={
                (newDraftDirty && !repliesDisabled) ||
                (editingReplyId !== null && editingReplyId !== reply._id)
              }
            />
          ))}
          {!replies.isDone && (
            <Button
              variant='outline'
              disabled={editingReplyId !== null}
              onClick={() => setCursor(replies.continueCursor)}
            >
              Next replies
            </Button>
          )}
          {cursor && (
            <Button
              variant='ghost'
              disabled={editingReplyId !== null}
              onClick={() => setCursor(null)}
            >
              First replies
            </Button>
          )}
        </>
      )}
      {newDraftDirty && !repliesDisabled && (
        <p className='text-sm text-muted-foreground'>
          Save or cancel your reply draft before editing another reply.
        </p>
      )}
      {repliesDisabled && (
        <p className='text-sm text-muted-foreground'>Replies are closed.</p>
      )}
      <div hidden={editingReplyId !== null || repliesDisabled}>
        <DiscussionComposer
          key={newDraftVersion}
          disabled={repliesDisabled}
          reply
          mentionMembers={members}
          onDraftChange={setNewDraftDirty}
          onCancel={() => setNewDraftVersion(value => value + 1)}
          submitLabel='Send reply'
          onContentChange={content => setTyping(content.length > 0)}
          onSave={async ({ content, attachments }) => {
            if (repliesClosed.current)
              throw new Error('Replies are closed. Your draft is preserved.');
            await create({ postId, content, attachments });
            setTyping(false);
          }}
        />
      </div>
    </section>
  );
}
function Reply({
  reply,
  groupId,
  editing,
  onEditingChange,
  editDisabled,
}: {
  reply: NonNullable<
    ReturnType<typeof hooks.useGroupPostReplies>
  >['page'][number];
  groupId: Id<'groups'>;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  editDisabled: boolean;
}) {
  const update = hooks.useUpdateGroupPostReply();
  const remove = hooks.useDeleteGroupPostReply();
  const members = useQuery(api.groupPosts.queries.mentionMembers, { groupId });
  return (
    <article className='space-y-3 rounded-card border border-border p-4'>
      <p className='text-sm text-muted-foreground'>
        {reply.authorName} · {new Date(reply.createdAt).toLocaleString()}
      </p>
      {editing ? (
        <DiscussionComposer
          reply
          initialContent={reply.content}
          existingAttachments={reply.attachments}
          mentionMembers={members}
          submitLabel='Save reply'
          onCancel={() => onEditingChange(false)}
          onSave={async ({ content, attachments, attachmentIdsToDelete }) => {
            await update({
              replyId: reply._id,
              content,
              attachmentsToAdd: attachments,
              attachmentIdsToDelete,
            });
            onEditingChange(false);
          }}
        />
      ) : (
        <>
          <DiscussionContent content={reply.content} members={members} />
          <AttachmentGallery attachments={reply.attachments} />
        </>
      )}
      <div className='flex flex-wrap gap-2'>
        {reply.canEdit && !editing && (
          <Button
            variant='outline'
            disabled={editDisabled}
            onClick={() => onEditingChange(true)}
          >
            Edit reply
          </Button>
        )}
        {reply.canDelete && (
          <GroupConfirmedAction
            label='Delete reply'
            confirmation='Confirm deleting reply'
            explanation='This permanently deletes this reply and its attachments.'
            onConfirm={async () => {
              await remove({ replyId: reply._id });
              if (editing) onEditingChange(false);
            }}
          />
        )}
      </div>
    </article>
  );
}
