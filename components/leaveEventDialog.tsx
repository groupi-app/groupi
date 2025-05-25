'use client';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { leaveEvent } from '@/lib/actions/event';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';

async function exitEvent({
  id,
  toast,
  router,
}: {
  id: string;
  toast: any;
  router: AppRouterInstance;
}) {
  const res = await leaveEvent(id);
  if (res.success) {
    router.push(`/events`);
    toast({
      title: 'Event left',
      description: 'You have left the event.',
    });
  } else {
    toast({
      title: 'Uh oh!',
      description: 'Unable to leave the event.',
      variant: 'destructive',
    });
  }
}

export function LeaveEventDialog({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
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
                exitEvent({ id, toast, router });
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
