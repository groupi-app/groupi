'use client';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDeleteEvent } from '@groupi/hooks';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function DeleteEventDialog({ eventId }: { eventId: string }) {
  const router = useRouter();
  const deleteEvent = useDeleteEvent();
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
              onClick={() => {
                deleteEvent.mutate(
                  { eventId },
                  {
                    onSuccess: () => {
                      router.push(`/events`);
                      toast.success('Event deleted', {
                        description: 'The event has been deleted.',
                      });
                    },
                    onError: () => {
                      toast.error('Uh oh!', {
                        description: 'The event could not be deleted.',
                      });
                    },
                  }
                );
              }}
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
