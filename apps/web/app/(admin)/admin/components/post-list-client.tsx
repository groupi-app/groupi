'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import {
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import type { PostAdminListItemData } from '@groupi/schema';
import { deletePostAction } from '@/actions/admin-actions';

type PostListClientProps = {
  initialPosts: PostAdminListItemData[];
  initialTotalCount: number;
  initialNextCursor?: string;
  currentCursor?: string;
  currentSearch?: string;
};

export function PostListClient({
  initialPosts,
  initialTotalCount,
  initialNextCursor,
  currentCursor,
  currentSearch,
}: PostListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] =
    useState<PostAdminListItemData | null>(null);
  const [isPending, startTransition] = useTransition();

  const searchQuery = currentSearch || '';

  const updateSearchParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleSearchChange = (value: string) => {
    updateSearchParams({
      postSearch: value || null,
      postCursor: null,
    });
  };

  const handleDelete = (post: PostAdminListItemData) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!postToDelete) return;

    startTransition(async () => {
      const [error] = await deletePostAction({ postId: postToDelete.id });

      if (error) {
        toast.error('Failed to delete post', {
          description: error.message,
        });
      } else {
        toast.success('Post deleted successfully');
        setDeleteDialogOpen(false);
        setPostToDelete(null);
        router.refresh();
      }
    });
  };

  const handleNextPage = () => {
    if (initialNextCursor) {
      updateSearchParams({ postCursor: initialNextCursor });
    }
  };

  const handlePreviousPage = () => {
    updateSearchParams({ postCursor: null });
  };

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const hasNextPage = !!initialNextCursor;
  const hasPreviousPage = !!currentCursor;

  return (
    <>
      <div className='space-y-4'>
        {/* Search Bar and Refresh */}
        <div className='flex items-center gap-2'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search posts by title or content...'
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              className='pl-9'
            />
          </div>
          <div className='text-sm text-muted-foreground'>
            {initialTotalCount} total
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={handleRefresh}
            disabled={isPending}
          >
            <RefreshCw
              className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>

        {/* Table */}
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Post</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Replies</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialPosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center py-8'>
                    <p className='text-muted-foreground'>
                      {searchQuery ? 'No posts found' : 'No posts yet'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                initialPosts.map(post => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div>
                        <div className='font-medium'>{post.title}</div>
                        <div className='text-sm text-muted-foreground line-clamp-2 max-w-md'>
                          {post.content}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='text-sm'>
                        <div className='font-medium'>
                          {post.author.name || post.author.email}
                        </div>
                        {post.author.name && (
                          <div className='text-muted-foreground'>
                            {post.author.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='text-sm font-medium'>
                        {post.event.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant='secondary'>{post._count.replies}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className='text-sm text-muted-foreground'>
                        {formatDistanceToNow(new Date(post.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleDelete(post)}
                        disabled={isPending}
                      >
                        <Trash2 className='h-4 w-4 text-destructive' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {initialPosts.length > 0 && (
          <div className='flex items-center justify-between'>
            <div className='text-sm text-muted-foreground'>
              Showing {initialPosts.length} of {initialTotalCount}
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={handlePreviousPage}
                disabled={!hasPreviousPage}
              >
                <ChevronLeft className='h-4 w-4 mr-1' />
                Previous
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={handleNextPage}
                disabled={!hasNextPage}
              >
                Next
                <ChevronRight className='h-4 w-4 ml-1' />
              </Button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the post{' '}
              <strong>{postToDelete?.title}</strong> and all associated replies.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              disabled={isPending}
            >
              {isPending ? 'Deleting...' : 'Delete Post'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
