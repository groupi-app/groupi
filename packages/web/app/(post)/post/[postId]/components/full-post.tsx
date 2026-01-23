'use client';

import { useState, useCallback } from 'react';
import { DeletePostDialog } from '@/components/delete-post-dialog';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { useMobile } from '@/hooks/use-mobile';
import { canDeletePost } from '@/lib/event-permissions';
import Link from 'next/link';
import { Id } from '@/convex/_generated/dataModel';
import MemberIcon from '@/components/member-icon';
import { MentionHandler } from './mention-handler';
import { usePostDetail } from '@/hooks/convex';
import { NotFoundError } from '@/components/error-display';
import { useIsPostMuted } from '@/hooks/convex/use-muting';
import { AttachmentGallery } from '@/components/attachments';

// Strip leading and trailing empty paragraph tags that BlockNote adds
const stripEmptyParagraphs = (html: string): string => {
  return html
    .replace(/^(<p>(\s|&nbsp;)*<\/p>)+/gi, '') // Remove leading empty paragraphs
    .replace(/(<p>(\s|&nbsp;)*<\/p>)+$/gi, '') // Remove trailing empty paragraphs
    .trim();
};

interface FullPostProps {
  postId: string;
  postRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Client component with direct Convex hooks - Client-only pattern
 * - Uses usePostDetail hook for real-time post data
 * - Real-time updates via Convex subscriptions
 * - Loading states managed by component
 */
export function FullPost({ postId, postRef }: FullPostProps) {
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const isMobile = useMobile();

  // Use direct Convex hook for real-time post detail data
  const postDetailData = usePostDetail(postId as Id<'posts'>);
  const { isMuted } = useIsPostMuted(postId as Id<'posts'>);

  const handleMoreClick = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile) {
        e.preventDefault();
        e.stopPropagation();
        setDrawerOpen(true);
      }
    },
    [isMobile]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isMobile) return;
      e.preventDefault();
      e.stopPropagation();
      setDrawerOpen(true);
    },
    [isMobile]
  );

  // Loading state - AFTER all hooks are called
  if (postDetailData === undefined) {
    return (
      <div className='pt-6 pb-0'>
        <div className='animate-pulse'>
          <div className='h-4 bg-muted rounded w-1/4 mb-6'></div>
          <div className='h-8 bg-muted rounded w-3/4 mb-4'></div>
          <div className='h-4 bg-muted rounded w-1/2 mb-2'></div>
          <div className='h-20 bg-muted rounded mb-4'></div>
        </div>
      </div>
    );
  }

  // Post was deleted or not found
  if (postDetailData === null) {
    return (
      <div className='pt-6 pb-0'>
        <NotFoundError
          resourceType='post'
          message="This post doesn't exist or may have been deleted."
          showBackButton={true}
          showHomeButton={true}
          compact={true}
        />
      </div>
    );
  }

  const { post, userMembership } = postDetailData;
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

  return (
    <div ref={postRef} className='pt-6 pb-0'>
      <div className='flex items-center justify-between'>
        <Link
          className='flex items-center gap-2 hover:cursor-pointer hover:opacity-80'
          href={`/event/${post.event._id}`}
        >
          <Icons.back className='w-4 h-4' />
          <span>Back to {post.event.title}</span>
        </Link>
        <div className='flex items-center gap-2'>
          {canDelete && (
            <>
              {isMobile ? (
                <>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='w-8 h-8 p-0 text-foreground hover:text-foreground'
                    onClick={handleMoreClick}
                    onContextMenu={handleContextMenu}
                    style={{ touchAction: 'manipulation' }}
                  >
                    <Icons.more className='h-4 w-4' />
                  </Button>
                  <Drawer
                    open={drawerOpen}
                    onOpenChange={open => {
                      // Prevent opening via onOpenChange - only allow via click/contextmenu handler
                      if (isMobile && open && !drawerOpen) {
                        return;
                      }
                      // Allow closing
                      if (!open) {
                        setDrawerOpen(false);
                      }
                    }}
                    modal={true}
                  >
                    <DrawerContent>
                      <DrawerHeader className='text-left'>
                        <VisuallyHidden>
                          <DrawerTitle>Post Options</DrawerTitle>
                        </VisuallyHidden>
                        <div className='flex flex-col gap-2 px-4 pb-4 pt-4'>
                          {isAuthor && (
                            <Link href={`/post/${post._id}/edit`}>
                              <Button
                                variant='ghost'
                                className='w-full justify-start'
                                onClick={() => setDrawerOpen(false)}
                              >
                                <Icons.edit className='mr-2 h-4 w-4' />
                                Edit Post
                              </Button>
                            </Link>
                          )}
                          <Button
                            variant='ghost'
                            className='w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10'
                            onClick={() => {
                              setDrawerOpen(false);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Icons.delete className='mr-2 h-4 w-4' />
                            Delete Post
                          </Button>
                        </div>
                      </DrawerHeader>
                    </DrawerContent>
                  </Drawer>
                </>
              ) : (
                <Dialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='w-8 h-8 p-0 text-foreground hover:text-foreground'
                      >
                        <Icons.more className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      {isAuthor && (
                        <DropdownMenuItem asChild>
                          <Link href={`/post/${post._id}/edit`}>
                            <Icons.edit className='mr-2 h-4 w-4' />
                            Edit Post
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DialogTrigger asChild>
                        <DropdownMenuItem className='text-red-600'>
                          <Icons.delete className='mr-2 h-4 w-4' />
                          Delete Post
                        </DropdownMenuItem>
                      </DialogTrigger>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DeletePostDialog id={post._id} eventId={post.event._id} />
                </Dialog>
              )}
            </>
          )}
        </div>
      </div>
      <div className='my-6 border-border rounded-lg'>
        <div className=''>
          <div className='flex items-center gap-3 mb-4'>
            {authorMember ? (
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
              <h1 className='text-2xl font-bold'>{post.title}</h1>
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
                className='prose prose-sm max-w-none py-2'
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
      {canDelete && isMobile && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DeletePostDialog id={post._id} eventId={post.event._id} />
        </Dialog>
      )}
    </div>
  );
}
