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
import { usePostDetail } from '@groupi/hooks';
import { useSession } from '@/lib/auth-client';
import Link from 'next/link';

export function FullPost({ postId }: { postId: string }) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { data, isLoading } = usePostDetail(postId);

  if (isLoading || !data) {
    return <div>Loading...</div>;
  }

  const [error, postData] = data;

  if (error) {
    switch (error._tag) {
      case 'NotFoundError':
        return (
          <div className='text-center py-8'>
            <h1 className='text-2xl font-bold text-red-600'>Post not found</h1>
          </div>
        );
      case 'UnauthorizedError':
        return (
          <div className='text-center py-8'>
            <h1 className='text-2xl font-bold text-red-600'>
              You are not a member of this event
            </h1>
          </div>
        );
      default:
        return (
          <div className='text-center py-8'>
            <h1 className='text-2xl font-bold text-red-600'>
              An unexpected error occurred
            </h1>
          </div>
        );
    }
  }

  const { post, userMembership } = postData;
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
                      <Link href={`/post/${postId}/edit`}>
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
              <DeletePostDialog id={postId} />
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
