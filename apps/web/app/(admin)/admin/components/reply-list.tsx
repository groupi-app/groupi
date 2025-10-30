'use client';

import { useState } from 'react';
import { trpc } from '@/lib/utils/api';
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
import { Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ReplyAdminListItemDTO } from '@groupi/schema';

type ReplyListProps = {
  onSuccess: () => void;
};

export function ReplyList({ onSuccess }: ReplyListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [replyToDelete, setReplyToDelete] =
    useState<ReplyAdminListItemDTO | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [pageHistory, setPageHistory] = useState<(string | undefined)[]>([]);

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Reset to first page when searching
    setCursor(undefined);
    setPageHistory([]);
    // Debounce the actual search
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  const {
    data: repliesResult,
    isLoading,
    refetch,
  } = trpc.reply.listAll.useQuery({
    cursor,
    limit: 50,
    search: debouncedSearch || undefined,
  });
  const replies = repliesResult?.[1]?.items;
  const nextCursor = repliesResult?.[1]?.nextCursor;
  const totalCount = repliesResult?.[1]?.totalCount || 0;
  const error = repliesResult?.[0];

  const deleteMutation = trpc.reply.delete.useMutation({
    onSuccess: () => {
      onSuccess();
      refetch();
      setDeleteDialogOpen(false);
      setReplyToDelete(null);
    },
  });

  const handleDelete = (reply: ReplyAdminListItemDTO) => {
    setReplyToDelete(reply);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (replyToDelete) {
      deleteMutation.mutate({ replyId: replyToDelete.id });
    }
  };

  const handleNextPage = () => {
    if (nextCursor) {
      setPageHistory([...pageHistory, cursor]);
      setCursor(nextCursor);
    }
  };

  const handlePreviousPage = () => {
    if (pageHistory.length > 0) {
      const newHistory = [...pageHistory];
      const previousCursor = newHistory.pop();
      setPageHistory(newHistory);
      setCursor(previousCursor);
    }
  };

  const currentPage = pageHistory.length + 1;
  const hasNextPage = !!nextCursor;
  const hasPreviousPage = pageHistory.length > 0;

  return (
    <>
      <div className='space-y-4'>
        {/* Search Bar */}
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
            {totalCount} total
          </div>
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center py-8'>
                    <p className='text-muted-foreground'>Loading replies...</p>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center py-8'>
                    <p className='text-destructive'>Error loading replies</p>
                  </TableCell>
                </TableRow>
              ) : !replies || replies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center py-8'>
                    <p className='text-muted-foreground'>
                      {searchQuery ? 'No replies found' : 'No replies yet'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                replies.map(reply => (
                  <TableRow key={reply.id}>
                    <TableCell>
                      <div className='text-sm line-clamp-2 max-w-md'>
                        {reply.text}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='text-sm'>
                        <div className='font-medium'>
                          {reply.author.name || reply.author.email}
                        </div>
                        {reply.author.name && (
                          <div className='text-muted-foreground'>
                            {reply.author.email}
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
                        disabled={deleteMutation.isPending}
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
        {!isLoading && replies && replies.length > 0 && (
          <div className='flex items-center justify-between'>
            <div className='text-sm text-muted-foreground'>
              Page {currentPage}
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
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Reply'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
