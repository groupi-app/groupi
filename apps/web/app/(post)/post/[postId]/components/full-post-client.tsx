'use client';

import { DeletePostDialog } from './deletePostDialog';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PostDetailPageData } from '@groupi/schema/data';
import Link from 'next/link';
import { useState } from 'react';
import { useRealtimeSync } from '@/hooks/use-realtime-sync';

type Post = PostDetailPageData['post'];
type UserMembership = PostDetailPageData['userMembership'];

interface FullPostClientProps {
  post: Post;
  userMembership: UserMembership;
  userId: string;
}

/**
 * Client component with hybrid caching + realtime
 * - Receives cached initial data from server for fast load
 * - Syncs with realtime database changes for live updates
 */
export function FullPostClient({
  post: initialPost,
  userMembership,
  userId,
}: FullPostClientProps) {
  const [post, setPost] = useState(initialPost);

  // Sync with realtime post changes
  useRealtimeSync({
    channel: `post-${post.id}`,
    table: 'Post',
    filter: `id=eq.${post.id}`,
    onUpdate: payload => {
      // Optimistically update post
      setPost(prev => ({ ...prev, ...payload.new }));
    },
    refreshOnChange: true, // Also refresh cache in background
  });

  const { author } = post;
  const isAuthor = author.id === userId;
  const isModerator = userMembership.role === 'ORGANIZER';

  return (
    <div className='pt-6 pb-0'>
      <div className='flex items-center justify-between'>
        <Link
          className='flex items-center gap-2 hover:cursor-pointer hover:opacity-80'
          href={`/event/${post.event.id}`}
        >
          <Icons.back className='w-4 h-4' />
          <span>Back to {post.event.title}</span>
        </Link>
        <div className='flex items-center gap-2'>
          {(isAuthor || isModerator) && (
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
                <DropdownMenuContent>
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
        </div>
      </div>
      <div className='my-6 border-border rounded-lg'>
        <div className=''>
          <div className='flex items-center gap-3 mb-4 pb-2 border-b'>
            <div className='h-10 w-10 rounded-full bg-secondary flex items-center justify-center'>
              <span className='text-sm font-medium'>
                {author.user?.name?.[0] || author.user?.email[0]}
              </span>
            </div>
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
            <div
              className='prose prose-sm max-w-none'
              dangerouslySetInnerHTML={{
                __html: post.content.replace(/\n/g, '<br />'),
              }}
            />
          </div>
        </div>
        <div className='px-6 py-4 border-t mt-6'>
          <div className='flex items-center text-sm text-muted-foreground'>
            <Icons.reply className='w-4 h-4 mr-1' />
            <span>{post.replies.length} replies</span>
          </div>
        </div>
      </div>
    </div>
  );
}
