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
import { useLeaveEvent } from '@/hooks/mutations/use-leave-event';

export function LeaveEventDialog({ eventId }: { eventId: string }) {
  const router = useRouter();
  const leaveEvent = useLeaveEvent();

  const handleLeave = () => {
    leaveEvent.mutate(
      { eventId },
      {
        onSuccess: () => {
          toast.success('You have left the event.');
          router.push(`/events`);
        },
        onError: () => {
          toast.error('Unable to leave the event.');
        },
      }
    );
  };

  const isLeaving = leaveEvent.isPending;

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
            <Button variant='ghost' disabled={isLeaving}>
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              onClick={handleLeave}
              variant='destructive'
              disabled={isLeaving}
            >
              {isLeaving ? 'Leaving...' : 'Leave'}
            </Button>
          </DialogClose>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
