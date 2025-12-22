'use client';

import { Dialog } from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ContextMenuItem } from '@/components/ui/context-menu';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { canDeletePost } from '@/lib/event-permissions';
import { Member } from '@/types';
import type { RoleType } from '@groupi/schema';
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

type MinimalAuthor = {
  id: string;
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
};

type MinimalReply = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  author: MinimalAuthor;
};

type MinimalPostForCard = {
  id: string;
  title: string;
  content: string;
  author: MinimalAuthor;
  createdAt: Date;
  editedAt: Date | null;
  replies: MinimalReply[];
  authorId: string;
  event: { memberships: Member[] };
};

interface PostCardProps {
  postData: MinimalPostForCard;
  eventDateTime: Date | null;
  userId: string;
  userRole: RoleType;
}

export function PostCard({
  postData,
  eventDateTime,
  userId,
  userRole,
}: PostCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const {
    sheetOpen,
    setSheetOpen,
    handleContextMenu: baseHandleContextMenu,
    handleClick,
    handleMoreClick: baseHandleMoreClick,
  } = useActionMenu();

  const {
    id,
    title,
    content,
    author,
    createdAt,
    editedAt,
    replies,
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

  // Wrap handlers to check canDelete
  const handleContextMenu = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!canDelete) return;
      baseHandleContextMenu(e);
    },
    [canDelete, baseHandleContextMenu]
  );

  const handleMoreClick = useCallback(
    (e: React.MouseEvent) => {
      if (!canDelete) return;
      baseHandleMoreClick(e);
    },
    [canDelete, baseHandleMoreClick]
  );

  const isMe = author ? userId === authorId : false;

  if (!author) return null;

  const members = event.memberships;
  const member = members.find((m: Member) => m.personId === authorId);

  // Drawer content for mobile
  const drawerContent = (
    <div className='flex flex-col gap-2 px-4 pb-4 pt-4'>
      {isMe && (
        <Button variant='ghost' className='w-full justify-start' asChild>
          <Link href={`/post/${id}/edit`}>
            <Icons.edit className='size-4 mr-2' />
            Edit
          </Link>
        </Button>
      )}
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
    </div>
  );

  // Context menu content for desktop
  const contextMenuContent = canDelete ? (
    <>
      {isMe && (
        <ContextMenuItem className='cursor-pointer' asChild>
          <Link href={`/post/${id}/edit`}>
            <div className='flex items-center gap-1'>
              <Icons.edit className='size-4' />
              <span>Edit</span>
            </div>
          </Link>
        </ContextMenuItem>
      )}
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
    </>
  ) : null;

  // Dropdown menu content for desktop action button
  const dropdownContent = (
    <>
      {isMe && (
        <DropdownMenuItem className='cursor-pointer' asChild>
          <Link href={`/post/${id}/edit`}>
            <div className='flex items-center gap-1'>
              <Icons.edit className='size-4' />
              <span>Edit</span>
            </div>
          </Link>
        </DropdownMenuItem>
      )}
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
    </>
  );

  const cardContent = (
    <div className='rounded-xl border border-border w-full relative shadow-md z-10 group'>
      <div className='absolute top-4 left-3'>
        {member ? (
          <MemberIcon
            itemKey={member.id}
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
      {canDelete && (
        <ActionMenuButton
          onClick={handleMoreClick}
          onContextMenu={handleContextMenu}
          className='absolute z-20 size-8 hover:bg-accent transition-all rounded-md top-2 right-2 flex items-center justify-center'
          dropdownContent={dropdownContent}
        >
          <Icons.more className='size-4' />
        </ActionMenuButton>
      )}
      <Link data-test='post-card' href={`/post/${id}`} className='w-full z-10'>
        <div className='w-full rounded-xl bg-card hover:bg-accent transition-colors pt-4 px-5 pb-2'>
          <div className='flex flex-col gap-1'>
            <div className='ml-12 mb-2 flex flex-col -space-y-1 w-full pr-16'>
              <span className='sm:text-xl font-heading text-card-foreground truncate overflow-hidden w-full'>
                {title}
              </span>
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
                <span className='text-sm'>{replies.length} replies</span>
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
        disabled={!canDelete}
      >
        {cardContent}
      </ActionMenu>
      <DeletePostDialog id={id} />
    </Dialog>
  );
}

export function PostCardSkeleton() {
  return (
    <div className='rounded-xl border border-border w-full relative shadow-md max-w-4xl'>
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

