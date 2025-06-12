'use client';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { deleteReply } from '@/lib/actions/reply';
import { Button } from './ui/button';
import { toast } from 'sonner';

async function removeReply({ id }: { id: string }) {
  const res = await deleteReply({ id });
  if (res.success) {
    toast.success('The reply has been deleted.');
  } else {
    toast.error('The reply could not be deleted.');
  }
}

export function DeleteReplyDialog({ id }: { id: string }) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete Reply?</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete this reply? This action cannot be
          undone.
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
                removeReply({ id });
              }}
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
