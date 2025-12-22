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
import type { PostDetailPageData } from '@groupi/schema/data';
import { canDeletePost } from '@/lib/event-permissions';
import Link from 'next/link';
import { usePusherRealtime } from '@/hooks/use-pusher-realtime';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPostDetail } from '@/lib/queries/post-queries';
import { qk } from '@/lib/query-keys';
import MemberIcon from '@/components/member-icon';
import { MentionHandler } from './mention-handler';

type Post = PostDetailPageData['post'];
type UserMembership = PostDetailPageData['userMembership'];

interface FullPostClientProps {
  post: Post;
  userMembership: UserMembership;
  userId: string;
}

/**
 * Client component with hybrid caching + realtime
 * - Receives cached initial data from server for fast load (SSR/PPR)
 * - React Query manages client-side state for optimistic updates
 * - Pusher syncs real-time updates via setQueryData (no router.refresh)
 */
export function FullPostClient({
  post: initialPost,
  userMembership,
  userId,
  postRef,
}: FullPostClientProps & { postRef?: React.RefObject<HTMLDivElement | null> }) {
  const queryClient = useQueryClient();

  // React Query manages client-side state
  const { data: postDetail } = useQuery({
    queryKey: qk.posts.detail(initialPost.id),
    queryFn: () => fetchPostDetail(initialPost.id),
    initialData: {
      post: initialPost,
      userMembership,
    } as PostDetailPageData,
    staleTime: 30 * 1000, // Consider fresh for 30s (matches server cache TTL)
    select: data => data.post, // Extract post from detail
  });

  const post = postDetail || initialPost;

  // Sync with Pusher post changes using setQueryData (no router.refresh)
  usePusherRealtime({
    channel: `event-${post.event.id}-posts`,
    event: 'post-changed',
    tags: [`post-${post.id}`, `event-${post.event.id}-posts`],
    queryKey: qk.posts.detail(post.id),
    // Custom handler to update only this post
    onUpdate: data => {
      // Pusher sends PostData (minimal) but we need to preserve full Post structure
      const updateData = data as {
        id: string;
        title?: string;
        content?: string;
        updatedAt?: Date | string;
        editedAt?: Date | string | null;
        // Full structure might also be present
        event?: Post['event'];
        author?: Post['author'];
        replies?: Post['replies'];
      };

      if (updateData.id === post.id) {
        queryClient.setQueryData<PostDetailPageData>(
          qk.posts.detail(post.id),
          old => {
            if (!old) return old;

            // Merge update data with existing post structure
            // Preserve event, author, and replies if updateData doesn't have them
            const updatedPost: Post = {
              ...old.post,
              ...updateData,
              // Preserve nested structures if not in update
              event: updateData.event || old.post.event,
              author: updateData.author || old.post.author,
              replies: updateData.replies || old.post.replies,
              // Handle date conversions
              updatedAt: updateData.updatedAt
                ? typeof updateData.updatedAt === 'string'
                  ? new Date(updateData.updatedAt)
                  : updateData.updatedAt
                : old.post.updatedAt,
              editedAt:
                updateData.editedAt !== undefined
                  ? updateData.editedAt
                    ? typeof updateData.editedAt === 'string'
                      ? new Date(updateData.editedAt)
                      : updateData.editedAt
                    : updateData.updatedAt
                      ? typeof updateData.updatedAt === 'string'
                        ? new Date(updateData.updatedAt)
                        : updateData.updatedAt
                      : old.post.updatedAt
                  : old.post.editedAt,
            };

            return {
              ...old,
              post: updatedPost,
            };
          }
        );
      }
    },
  });

  const { author } = post;
  const isAuthor = author.id === userId;
  const canDelete = canDeletePost({
    userId,
    userRole: userMembership.role,
    postAuthorId: author.id,
  });

  // Find member for post author
  const getMemberForAuthor = () => {
    return post.event.memberships?.find(m => m.personId === author.id);
  };

  const authorMember = getMemberForAuthor();

  const isMobile = useMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  return (
    <div ref={postRef} className='pt-6 pb-0'>
      <div className='flex items-center justify-between'>
        <Link
          className='flex items-center gap-2 hover:cursor-pointer hover:opacity-80'
          href={`/event/${post.event.id}`}
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
                            <Button
                              variant='ghost'
                              className='w-full justify-start'
                              asChild
                              onClick={() => setDrawerOpen(false)}
                            >
                              <Link href={`/post/${post.id}/edit`}>
                                <Icons.edit className='mr-2 h-4 w-4' />
                                Edit Post
                              </Link>
                            </Button>
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
                          <Link href={`/post/${post.id}/edit`}>
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
                  <DeletePostDialog id={post.id} />
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
                itemKey={authorMember.id}
                userId={userId}
                userRole={userMembership.role}
                member={authorMember}
                eventDateTime={post.event.chosenDateTime}
                align='start'
              />
            ) : (
              <div className='h-10 w-10 rounded-full bg-secondary flex items-center justify-center'>
                <span className='text-sm font-medium'>
                  {author.user?.name?.[0] || author.user?.email[0]}
                </span>
              </div>
            )}
            <div className='flex-1'>
              <p className='text-sm font-medium'>
                {author.user?.name || author.user?.email}
              </p>
              <p className='text-xs text-muted-foreground'>
                {new Date(post.createdAt).toLocaleString()}
                {post.editedAt && ' (edited)'}
              </p>
            </div>
          </div>
          <div className=''>
            <h1 className='text-2xl font-bold mb-3'>{post.title}</h1>
            <MentionHandler
              members={post.event.memberships}
              userId={userId}
              userRole={userMembership.role}
              eventDateTime={post.event.chosenDateTime}
            >
              <div
                className='prose prose-sm max-w-none py-2'
                dangerouslySetInnerHTML={{
                  __html: post.content,
                }}
              />
            </MentionHandler>
          </div>
        </div>
      </div>
      {canDelete && isMobile && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DeletePostDialog id={post.id} />
        </Dialog>
      )}
    </div>
  );
}
