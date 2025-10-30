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
import { Badge } from '@/components/ui/badge';
import { Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { EventAdminListItemDTO } from '@groupi/schema';

type EventListProps = {
  onSuccess: () => void;
};

export function EventList({ onSuccess }: EventListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] =
    useState<EventAdminListItemDTO | null>(null);
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
    data: eventsResult,
    isLoading,
    refetch,
  } = trpc.event.listAll.useQuery({
    cursor,
    limit: 50,
    search: debouncedSearch || undefined,
  });
  const events = eventsResult?.[1]?.items;
  const nextCursor = eventsResult?.[1]?.nextCursor;
  const totalCount = eventsResult?.[1]?.totalCount || 0;
  const error = eventsResult?.[0];

  const deleteMutation = trpc.event.delete.useMutation({
    onSuccess: () => {
      onSuccess();
      refetch();
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    },
  });

  const handleDelete = (event: EventAdminListItemDTO) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (eventToDelete) {
      deleteMutation.mutate({ eventId: eventToDelete.id as string });
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
              placeholder='Search events by title, description, or location...'
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
                <TableHead>Event</TableHead>
                <TableHead>Organizer</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Posts</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center py-8'>
                    <p className='text-muted-foreground'>Loading events...</p>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center py-8'>
                    <p className='text-destructive'>Error loading events</p>
                  </TableCell>
                </TableRow>
              ) : !events || events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center py-8'>
                    <p className='text-muted-foreground'>
                      {searchQuery ? 'No events found' : 'No events yet'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                events.map(event => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div>
                        <div className='font-medium'>{event.title}</div>
                        {event.description && (
                          <div className='text-sm text-muted-foreground line-clamp-1'>
                            {event.description}
                          </div>
                        )}
                        {event.location && (
                          <div className='text-xs text-muted-foreground'>
                            📍 {event.location}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='text-sm'>
                        {event.organizer ? (
                          <>
                            <div className='font-medium'>
                              {event.organizer.name || event.organizer.email}
                            </div>
                            {event.organizer.name && (
                              <div className='text-muted-foreground'>
                                {event.organizer.email}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className='text-muted-foreground'>
                            No organizer
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant='secondary'>
                        {event._count.memberships}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant='secondary'>{event._count.posts}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className='text-sm text-muted-foreground'>
                        {formatDistanceToNow(new Date(event.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleDelete(event)}
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
        {!isLoading && events && events.length > 0 && (
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
              This will permanently delete the event{' '}
              <strong>{eventToDelete?.title}</strong> and all associated data
              including posts, replies, and memberships. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Event'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
