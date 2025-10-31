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
import type { EventAdminListItemData } from '@groupi/schema';
import { deleteEventAction } from '@/actions/admin-actions';

type EventListClientProps = {
  initialEvents: EventAdminListItemData[];
  initialTotalCount: number;
  initialNextCursor?: string;
  currentCursor?: string;
  currentSearch?: string;
};

export function EventListClient({
  initialEvents,
  initialTotalCount,
  initialNextCursor,
  currentCursor,
  currentSearch,
}: EventListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] =
    useState<EventAdminListItemData | null>(null);
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
      eventSearch: value || null,
      eventCursor: null, // Reset to first page
    });
  };

  const handleDelete = (event: EventAdminListItemData) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!eventToDelete) return;

    startTransition(async () => {
      const [error] = await deleteEventAction({ eventId: eventToDelete.id });

      if (error) {
        toast.error('Failed to delete event', {
          description: error.message,
        });
      } else {
        toast.success('Event deleted successfully');
        setDeleteDialogOpen(false);
        setEventToDelete(null);
        router.refresh();
      }
    });
  };

  const handleNextPage = () => {
    if (initialNextCursor) {
      updateSearchParams({ eventCursor: initialNextCursor });
    }
  };

  const handlePreviousPage = () => {
    // For now, just reset to first page
    // A more robust solution would maintain page history
    updateSearchParams({ eventCursor: null });
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
              placeholder='Search events by title, description, or location...'
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
                <TableHead>Event</TableHead>
                <TableHead>Organizer</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Posts</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center py-8'>
                    <p className='text-muted-foreground'>
                      {searchQuery ? 'No events found' : 'No events yet'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                initialEvents.map(event => (
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
        {initialEvents.length > 0 && (
          <div className='flex items-center justify-between'>
            <div className='text-sm text-muted-foreground'>
              Showing {initialEvents.length} of {initialTotalCount}
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
              disabled={isPending}
            >
              {isPending ? 'Deleting...' : 'Delete Event'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
