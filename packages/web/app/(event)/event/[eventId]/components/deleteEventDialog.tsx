'use client';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useDeleteEvent } from '@/hooks/mutations/use-delete-event';
import { Id } from '@/convex/_generated/dataModel';

export function DeleteEventDialog({ eventId }: { eventId: Id<'events'> }) {
  const router = useRouter();
  const deleteEvent = useDeleteEvent();

  const handleDelete = () => {
    // Start deletion first - this triggers the optimistic update immediately
    // (synchronously removes event from cache before the promise resolves)
    const deletePromise = deleteEvent(eventId);

    // Navigate to events page - the optimistic update has already removed the event
    router.push('/events');

    // Handle mutation result in background
    deletePromise
      .then(() => {
        toast.success('Event deleted', {
          description: 'The event has been deleted.',
        });
      })
      .catch(() => {
        toast.error('Uh oh!', {
          description: 'The event could not be deleted.',
        });
      });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete Event?</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete this event? This action cannot be
          undone and all event data will be lost.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <div className='flex items-center gap-2'>
          <DialogClose className='grow' asChild>
            <Button variant='ghost'>Cancel</Button>
          </DialogClose>
          <DialogClose className='grow' asChild>
            <Button
              onClick={handleDelete}
              className='w-full'
              variant='destructive'
            >
              Delete
            </Button>
          </DialogClose>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
