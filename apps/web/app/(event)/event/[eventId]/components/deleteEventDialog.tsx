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

export function DeleteEventDialog({ eventId }: { eventId: string }) {
  const router = useRouter();
  const deleteEvent = useDeleteEvent();

  const handleDelete = () => {
    deleteEvent.mutate(
      { eventId },
      {
        onSuccess: () => {
          toast.success('Event deleted', {
            description: 'The event has been deleted.',
          });
          router.push(`/events`);
        },
        onError: () => {
          toast.error('Uh oh!', {
            description: 'The event could not be deleted.',
          });
        },
      }
    );
  };

  const isDeleting = deleteEvent.isPending;

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
