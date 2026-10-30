'use client';

import { useState } from 'react';
import { Pin } from 'lucide-react';
import {
  usePostStateActions,
  PostStateMenuItems,
} from '@/features/discussion/post-state-actions';
import { ActionMenu } from '@/components/ui/action-menu';
import { ActionMenuButton } from '@/components/ui/action-menu-button';
import { useActionMenu } from '@/hooks/use-action-menu';
import { ContextMenuItem } from '@/components/ui/context-menu';
import { DeletePostDialog } from '@/components/delete-post-dialog';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { canDeletePost } from '@/lib/event-permissions';
import Link from 'next/link';
import MemberIcon from '@/components/member-icon';
import { IntegrationAuthor } from '@/components/molecules/integration-author';
import { MentionHandler } from './mention-handler';
import { useIsPostMuted } from '@/hooks/convex/use-muting';
import { AttachmentGallery } from '@/components/attachments';
import { usePostDetail } from '@/hooks/convex/use-posts';

// Type for post detail data from context
type PostDetailData = NonNullable<ReturnType<typeof usePostDetail>>;

// Strip leading and trailing empty paragraph tags that BlockNote adds
const stripEmptyParagraphs = (html: string): string => {
  return html
    .replace(/^(<p>(\s|&nbsp;)*<\/p>)+/gi, '') // Remove leading empty paragraphs
    .replace(/(<p>(\s|&nbsp;)*<\/p>)+$/gi, '') // Remove trailing empty paragraphs
    .trim();
};

interface FullPostProps {
  data: PostDetailData;
  postRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Displays full post content with author info, attachments, and actions.
 * Data is provided via props from the EventDataProvider context.
 */
export function FullPost({ data, postRef }: FullPostProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { sheetOpen, setSheetOpen, handleContextMenu, handleMoreClick } =
    useActionMenu();
  const { isMuted } = useIsPostMuted(data.post._id);
  const stateActions = usePostStateActions(data.post, () =>
    setSheetOpen(false)
  );
  // Extract post and user membership from data (already validated by parent)
  const { post, userMembership } = data;
  // Use personId directly from membership (more reliable than person._id from spread)
  const userId = userMembership.personId;

  const author = post.author;
  // Use post.authorId directly for reliable comparison (it's always present on the post)
  const isAuthor = post.authorId === userId;
  const canDelete = canDeletePost({
    userId: userId,
    userRole: userMembership.role,
    postAuthorId: post.authorId,
  });

  // Find member for post author
  const getMemberForAuthor = () => {
    return post.event.memberships?.find(
      (m: { personId?: string }) => m.personId === post.authorId
    );
  };

  const authorMember = getMemberForAuthor();

  const editHref = `/event/${post.event._id}/post/${post._id}/edit`;
  const drawer = (
    <div className='flex flex-col gap-2 p-4'>
      <PostStateMenuItems state={stateActions} menu='drawer' />
      {isAuthor && (
        <Button variant='ghost' className='justify-start' asChild>
          <Link href={editHref}>Edit post</Link>
        </Button>
      )}
      {canDelete && (
        <Button
          variant='destructive-ghost'
          className='justify-start'
          onClick={() => {
            setSheetOpen(false);
            setDeleteDialogOpen(true);
          }}
        >
          Delete post
        </Button>
      )}
    </div>
  );
  const dropdown = (
    <>
      <PostStateMenuItems state={stateActions} menu='dropdown' />
      {isAuthor && (
        <DropdownMenuItem asChild>
          <Link href={editHref}>Edit post</Link>
        </DropdownMenuItem>
      )}
      {canDelete && (
        <DropdownMenuItem
          variant='destructive'
          onSelect={() => setDeleteDialogOpen(true)}
        >
          Delete post
        </DropdownMenuItem>
      )}
    </>
  );
  const context = (
    <>
      <PostStateMenuItems state={stateActions} menu='context' />
      {isAuthor && (
        <ContextMenuItem asChild>
          <Link href={editHref}>Edit post</Link>
        </ContextMenuItem>
      )}
      {canDelete && (
        <ContextMenuItem
          variant='destructive'
          onSelect={() => setDeleteDialogOpen(true)}
        >
          Delete post
        </ContextMenuItem>
      )}
    </>
  );
  return (
    <div ref={postRef} className='pt-6 pb-0'>
      <ActionMenu
        drawerTitle='Post actions'
        drawerContent={drawer}
        contextMenuContent={context}
        sheetOpen={sheetOpen}
        onSheetOpenChange={setSheetOpen}
        onContextMenu={handleContextMenu}
        onClick={() => {}}
      >
        <div className='flex items-center justify-between gap-2'>
          <Link
            className='flex min-w-0 items-center gap-2 hover:opacity-80'
            href={`/event/${post.event._id}`}
          >
            <Icons.back className='size-4 shrink-0' />
            <span className='min-w-0 break-words'>
              Back to {post.event.title}
            </span>
          </Link>
          {(isAuthor || canDelete || stateActions.actions.length > 0) && (
            <ActionMenuButton
              label={`Actions for post ${post.title}`}
              onClick={handleMoreClick}
              onContextMenu={handleContextMenu}
              dropdownContent={dropdown}
            >
              <Icons.more className='size-4' />
            </ActionMenuButton>
          )}
        </div>
      </ActionMenu>
      {stateActions.error && (
        <p role='alert' className='mt-2 text-sm text-error'>
          {stateActions.error}
        </p>
      )}
      <div className='my-6 border-border rounded-lg'>
        <div className=''>
          <div className='flex items-center gap-3 mb-4'>
            {author?.kind === 'integration' ? (
              <IntegrationAuthor
                name={author.user.name || 'Integration'}
                showName={false}
              />
            ) : authorMember ? (
              <MemberIcon
                itemKey={authorMember._id}
                userId={userId}
                userRole={userMembership.role}
                member={authorMember}
                eventDateTime={
                  post.event.chosenDateTime
                    ? new Date(post.event.chosenDateTime)
                    : null
                }
                align='start'
              />
            ) : (
              <div className='h-10 w-10 rounded-full bg-secondary flex items-center justify-center'>
                <span className='text-sm font-medium'>
                  {author?.user?.name?.[0] || author?.user?.email?.[0] || '?'}
                </span>
              </div>
            )}
            <div className='flex-1'>
              <p className='text-sm font-medium'>
                {author?.user?.name || author?.user?.email || 'Unknown'}
                {author?.kind === 'integration' ? (
                  <Badge variant='secondary' className='ml-2'>
                    Integration
                  </Badge>
                ) : null}
              </p>
              <p className='text-xs text-muted-foreground'>
                {new Date(post._creationTime).toLocaleString()}
                {post.editedAt &&
                  post.editedAt !== post._creationTime &&
                  ' (edited)'}
              </p>
            </div>
          </div>
          <div className=''>
            <div className='flex items-center gap-2 mb-3'>
              {post.pinnedAt !== undefined && (
                <Pin
                  className='size-4 shrink-0 text-muted-foreground'
                  aria-label='Pinned post'
                />
              )}
              <h1 className='min-w-0 break-words font-heading text-2xl font-bold'>
                {post.title}
              </h1>
              {isMuted && (
                <Icons.bellOff className='size-5 text-muted-foreground flex-shrink-0' />
              )}
            </div>
            <MentionHandler
              members={post.event.memberships || []}
              userId={userId}
              userRole={userMembership.role}
              eventDateTime={
                post.event.chosenDateTime
                  ? new Date(post.event.chosenDateTime)
                  : null
              }
            >
              <div
                className='prose prose-sm dark:prose-invert max-w-none py-2'
                dangerouslySetInnerHTML={{
                  __html: stripEmptyParagraphs(post.content),
                }}
              />
            </MentionHandler>
            {/* Display post attachments */}
            {post.attachments && post.attachments.length > 0 && (
              <AttachmentGallery
                attachments={post.attachments}
                className='mt-4'
              />
            )}
          </div>
        </div>
      </div>
      {canDelete && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DeletePostDialog id={post._id} eventId={post.event._id} />
        </Dialog>
      )}
    </div>
  );
}
