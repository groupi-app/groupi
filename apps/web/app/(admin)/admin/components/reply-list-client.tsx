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
import {
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import type { ReplyAdminListItemData } from '@groupi/schema';
import { deleteReplyAction } from '@/actions/admin-actions';

type ReplyListClientProps = {
  initialReplies: ReplyAdminListItemData[];
  initialTotalCount: number;
  initialNextCursor?: string;
  currentCursor?: string;
  currentSearch?: string;
};

export function ReplyListClient({
  initialReplies,
  initialTotalCount,
  initialNextCursor,
  currentCursor,
  currentSearch,
}: ReplyListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [replyToDelete, setReplyToDelete] =
    useState<ReplyAdminListItemData | null>(null);
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
      replySearch: value || null,
      replyCursor: null,
    });
  };

  const handleDelete = (reply: ReplyAdminListItemData) => {
    setReplyToDelete(reply);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!replyToDelete) return;

    startTransition(async () => {
      const [error] = await deleteReplyAction({ replyId: replyToDelete.id });

      if (error) {
        toast.error('Failed to delete reply', {
          description: error.message,
        });
      } else {
        toast.success('Reply deleted successfully');
        setDeleteDialogOpen(false);
        setReplyToDelete(null);
        router.refresh();
      }
    });
  };

  const handleNextPage = () => {
    if (initialNextCursor) {
      updateSearchParams({ replyCursor: initialNextCursor });
    }
  };

  const handlePreviousPage = () => {
    updateSearchParams({ replyCursor: null });
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
              placeholder='Search replies by content...'
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
                <TableHead>Reply</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Post</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialReplies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center py-8'>
                    <p className='text-muted-foreground'>
                      {searchQuery ? 'No replies found' : 'No replies yet'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                initialReplies.map(reply => (
                  <TableRow key={reply.id}>
                    <TableCell>
                      <div className='text-sm line-clamp-2 max-w-md'>
                        {reply.text}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='text-sm'>
                        {reply.author ? (
                          <>
                            <div className='font-medium'>
                              {reply.author.name || reply.author.email}
                            </div>
                            {reply.author.name && (
                              <div className='text-muted-foreground'>
                                {reply.author.email}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className='text-muted-foreground'>
                            Unknown author
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='text-sm font-medium line-clamp-1 max-w-xs'>
                        {reply.post.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='text-sm font-medium line-clamp-1 max-w-xs'>
                        {reply.post.event.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className='text-sm text-muted-foreground'>
                        {formatDistanceToNow(new Date(reply.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleDelete(reply)}
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
        {initialReplies.length > 0 && (
          <div className='flex items-center justify-between'>
            <div className='text-sm text-muted-foreground'>
              Showing {initialReplies.length} of {initialTotalCount}
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
              This will permanently delete this reply. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              disabled={isPending}
            >
              {isPending ? 'Deleting...' : 'Delete Reply'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
