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
import { useState } from 'react';
import { Id } from '@/convex/_generated/dataModel';

export function DeleteEventDialog({ eventId }: { eventId: Id<"events"> }) {
  const router = useRouter();
  const deleteEvent = useDeleteEvent();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteEvent(eventId);
      toast.success('Event deleted', {
        description: 'The event has been deleted.',
      });
      router.push(`/events`);
    } catch {
      toast.error('Uh oh!', {
        description: 'The event could not be deleted.',
      });
    } finally {
      setIsDeleting(false);
    }
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
            <Button variant='ghost' disabled={isDeleting}>
              Cancel
            </Button>
          </DialogClose>
          <DialogClose className='grow' asChild>
            <Button
              onClick={handleDelete}
              className='w-full'
              variant='destructive'
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogClose>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
