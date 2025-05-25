'use client';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { deleteEvent } from '@/lib/actions/event';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';

async function removeEvent({
  id,
  toast,
  router,
}: {
  id: string;
  toast: any;
  router: AppRouterInstance;
}) {
  const res = await deleteEvent(id);
  if (res.success) {
    router.push(`/events`);
    toast({
      title: 'Event deleted',
      description: 'The event has been deleted.',
    });
  } else {
    toast({
      title: 'Uh oh!',
      description: 'The event could not be deleted.',
      variant: 'destructive',
    });
  }
}

export function DeleteEventDialog({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
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
                removeEvent({ id, toast, router });
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
