'use client';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLeaveEvent } from '@groupi/hooks';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function LeaveEventDialog({ eventId }: { eventId: string }) {
  const router = useRouter();
  const leaveEvent = useLeaveEvent();
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Leave Event?</DialogTitle>
        <DialogDescription>
          Are you sure you want to leave this event? If you wish to rejoin, you
          will need to be re-invited.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <div className='flex items-center justify-end gap-2'>
          <DialogClose asChild>
            <Button variant='ghost'>Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              onClick={() => {
                leaveEvent.mutate(
                  { eventId },
                  {
                    onSuccess: () => {
                      router.push(`/events`);
                      toast.success('You have left the event.');
                    },
                    onError: () => {
                      toast.error('Unable to leave the event.');
                    },
                  }
                );
              }}
              variant='destructive'
            >
              Leave
            </Button>
          </DialogClose>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
