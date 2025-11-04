'use client';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { leaveEventAction } from '@/actions/event-actions';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';

export function LeaveEventDialog({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);

  const handleLeave = async () => {
    setIsLeaving(true);
    const [error] = await leaveEventAction({ eventId });

    if (error) {
      toast.error('Unable to leave the event.');
      setIsLeaving(false);
    } else {
      toast.success('You have left the event.');
      router.push(`/events`);
    }
  };

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
