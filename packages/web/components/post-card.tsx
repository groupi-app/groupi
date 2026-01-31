'use client';

import { Doc } from '../../../convex/_generated/dataModel';
import { User } from '@/convex/types';
import { Dialog } from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ContextMenuItem } from '@/components/ui/context-menu';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { canDeletePost } from '@/lib/event-permissions';
import Link from 'next/link';
import { DeletePostDialog } from './delete-post-dialog';
import { Icons } from '@/components/icons';
import MemberIcon from '@/components/member-icon';
import { PostCardContent } from './post-card-content';
import RepliesIcons from './replies-icons';
import { useActionMenu } from '@/hooks/use-action-menu';
import { ActionMenu } from '@/components/ui/action-menu';
import { ActionMenuButton } from '@/components/ui/action-menu-button';
import { useState, useCallback } from 'react';
import {
  useIsPostMutedFromContext,
  useTogglePostMute,
} from '@/hooks/convex/use-muting';

// Post data with related information
type PostData = Doc<'posts'> & {
  author: Doc<'persons'> & {
    user: User;
  };
  event: Doc<'events'> & {
    memberships: Array<
      Doc<'memberships'> & {
        person: Doc<'persons'> & {
          user: User;
        };
      }
    >;
  };
  replies: Array<Doc<'replies'>>;
  replyCount?: number;
  authorId: string;
};

export function PostCard({
  postData,
  eventDateTime,
  userId,
  userRole,
}: {
  postData: PostData;
  eventDateTime: Date | null;
  userId: string;
  userRole: string;
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const {
    sheetOpen,
    setSheetOpen,
    handleContextMenu: baseHandleContextMenu,
    handleClick,
    handleMoreClick: baseHandleMoreClick,
  } = useActionMenu();

  const {
    _id: id,
    title,
    content,
    author,
    _creationTime: createdAt,
    editedAt,
    replies,
    replyCount,
    authorId,
    event,
  } = postData;

  const canDelete = author
    ? canDeletePost({
        userId,
        userRole,
        postAuthorId: authorId,
      })
    : false;

  // Muting state (uses bulk context to avoid per-post queries)
  const { isMuted, setOptimisticMuted } = useIsPostMutedFromContext(id);
  const toggleMute = useTogglePostMute();

  const handleToggleMute = async () => {
    setSheetOpen(false);
    await toggleMute(id, isMuted, setOptimisticMuted);
  };

  // Wrap handlers - always allow since mute is available to all
  const handleContextMenu = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      baseHandleContextMenu(e);
    },
    [baseHandleContextMenu]
  );

  const handleMoreClick = useCallback(
    (e: React.MouseEvent) => {
      baseHandleMoreClick(e);
    },
    [baseHandleMoreClick]
  );

  const isMe = author ? userId === authorId : false;

  if (!author) return null;

  const members = event.memberships;
  const member = members.find(m => m.personId === authorId);

  // Drawer content for mobile
  const drawerContent = (
    <div className='flex flex-col gap-2 px-4 pb-4 pt-4'>
      <Button
        variant='ghost'
        className='w-full justify-start'
        onClick={handleToggleMute}
      >
        {isMuted ? (
          <>
            <Icons.bell className='size-4 mr-2' />
            Unmute Post
          </>
        ) : (
          <>
            <Icons.bellOff className='size-4 mr-2' />
            Mute Post
          </>
        )}
      </Button>
      {isMe && (
        <Button variant='ghost' className='w-full justify-start' asChild>
          <Link href={`/event/${event._id}/post/${id}/edit`}>
            <Icons.edit className='size-4 mr-2' />
            Edit
          </Link>
        </Button>
      )}
      {canDelete && (
        <Button
          variant='ghost'
          className='w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10'
          onClick={() => {
            setSheetOpen(false);
            setDeleteDialogOpen(true);
          }}
        >
          <Icons.delete className='size-4 mr-2' />
          Delete
        </Button>
      )}
    </div>
  );

  // Context menu content for desktop
  const contextMenuContent = (
    <>
      <ContextMenuItem
        onSelect={e => {
          e.preventDefault();
          handleToggleMute();
        }}
        className='cursor-pointer'
      >
        <div className='flex items-center gap-1'>
          {isMuted ? (
            <>
              <Icons.bell className='size-4' />
              <span>Unmute Post</span>
            </>
          ) : (
            <>
              <Icons.bellOff className='size-4' />
              <span>Mute Post</span>
            </>
          )}
        </div>
      </ContextMenuItem>
      {isMe && (
        <ContextMenuItem className='cursor-pointer' asChild>
          <Link href={`/event/${event._id}/post/${id}/edit`}>
            <div className='flex items-center gap-1'>
              <Icons.edit className='size-4' />
              <span>Edit</span>
            </div>
          </Link>
        </ContextMenuItem>
      )}
      {canDelete && (
        <ContextMenuItem
          onSelect={e => {
            e.preventDefault();
            setDeleteDialogOpen(true);
          }}
          className='cursor-pointer focus:bg-destructive focus:text-destructive-foreground'
        >
          <div className='flex items-center gap-1'>
            <Icons.delete className='size-4' />
            <span>Delete</span>
          </div>
        </ContextMenuItem>
      )}
    </>
  );

  // Dropdown menu content for desktop action button
  const dropdownContent = (
    <>
      <DropdownMenuItem
        onSelect={e => {
          e.preventDefault();
          handleToggleMute();
        }}
        className='cursor-pointer'
      >
        <div className='flex items-center gap-1'>
          {isMuted ? (
            <>
              <Icons.bell className='size-4' />
              <span>Unmute Post</span>
            </>
          ) : (
            <>
              <Icons.bellOff className='size-4' />
              <span>Mute Post</span>
            </>
          )}
        </div>
      </DropdownMenuItem>
      {isMe && (
        <DropdownMenuItem className='cursor-pointer' asChild>
          <Link href={`/event/${event._id}/post/${id}/edit`}>
            <div className='flex items-center gap-1'>
              <Icons.edit className='size-4' />
              <span>Edit</span>
            </div>
          </Link>
        </DropdownMenuItem>
      )}
      {canDelete && (
        <DropdownMenuItem
          onSelect={e => {
            e.preventDefault();
            setDeleteDialogOpen(true);
          }}
          className='cursor-pointer focus:bg-destructive focus:text-destructive-foreground'
        >
          <div className='flex items-center gap-1'>
            <Icons.delete className='size-4' />
            <span>Delete</span>
          </div>
        </DropdownMenuItem>
      )}
    </>
  );

  const cardContent = (
    <div className='rounded-card border border-border w-full relative shadow-floating z-lifted group'>
      <div className='absolute top-4 left-3'>
        {member ? (
          <MemberIcon
            itemKey={member._id}
            member={member}
            userId={userId}
            userRole={userRole}
            eventDateTime={eventDateTime}
            className='border-transparent'
            align='start'
          />
        ) : (
          <div className='rounded-full size-10 bg-primary' />
        )}
      </div>
      <ActionMenuButton
        onClick={handleMoreClick}
        onContextMenu={handleContextMenu}
        className='absolute z-float size-8 hover:bg-accent transition-all rounded-md top-2 right-2 flex items-center justify-center'
        dropdownContent={dropdownContent}
      >
        <Icons.more className='size-4' />
      </ActionMenuButton>
      <Link
        data-test='post-card'
        href={`/event/${event._id}/post/${id}`}
        className='w-full z-lifted'
      >
        <div className='w-full rounded-card bg-card hover:bg-accent transition-colors pt-4 px-5 pb-2'>
          <div className='flex flex-col gap-1'>
            <div className='ml-12 mb-2 flex flex-col -space-y-1 w-full pr-16'>
              <div className='flex items-center gap-2'>
                <span className='sm:text-xl font-heading text-card-foreground truncate overflow-hidden'>
                  {title}
                </span>
                {isMuted && (
                  <Icons.bellOff className='size-4 text-muted-foreground flex-shrink-0' />
                )}
              </div>
              <span className='text-sm text-muted-foreground'>
                {author.user.name || author.user.email}
              </span>
            </div>
            <PostCardContent content={content} />
            <div className='flex items-center justify-between mt-2'>
              <div className='flex flex-col sm:flex-row sm:items-center sm:gap-4'>
                <span className='text-muted-foreground text-sm'>
                  Created {formatDate(createdAt)}
                </span>
                {editedAt &&
                  new Date(editedAt).toISOString() !==
                    new Date(createdAt).toISOString() && (
                    <span className='text-muted-foreground text-sm'>
                      Edited {formatDate(editedAt)}
                    </span>
                  )}
              </div>
              <div className='text-muted-foreground flex items-center gap-1'>
                <RepliesIcons replies={replies} />
                <span className='text-sm'>
                  {replyCount ?? replies.length} replies
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );

  return (
    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <ActionMenu
        drawerTitle='Post Options'
        drawerContent={drawerContent}
        contextMenuContent={contextMenuContent}
        sheetOpen={sheetOpen}
        onSheetOpenChange={setSheetOpen}
        onContextMenu={handleContextMenu}
        onClick={handleClick}
      >
        {cardContent}
      </ActionMenu>
      <DeletePostDialog id={id} eventId={event._id} />
    </Dialog>
  );
}

export function PostCardSkeleton() {
  return (
    <div className='rounded-card border border-border w-full relative shadow-floating max-w-4xl'>
      <div className='w-full transition-all pt-4 px-5 pb-2'>
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-2 mb-1'>
            <Skeleton className='size-10 rounded-full' />
            <div className='flex flex-col space-y-1'>
              <Skeleton className='w-36 h-4' />
              <Skeleton className='w-16 h-3' />
            </div>
          </div>
          <div className='flex flex-wrap gap-1'>
            <Skeleton className='w-full h-4' />
            <Skeleton className='w-full h-4' />
            <Skeleton className='w-full h-4' />
            <Skeleton className='w-full h-4' />
            <Skeleton className='w-3/4 h-4' />
          </div>
          <div className='flex items-center justify-between mt-2'>
            <Skeleton className='w-16 h-4' />
            <Skeleton className='w-16 h-4' />
          </div>
        </div>
      </div>
    </div>
  );
}

// Attach Skeleton as a static property for backward compatibility
PostCard.Skeleton = PostCardSkeleton;
