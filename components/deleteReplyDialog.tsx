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
import { useToast } from './ui/use-toast';

async function removeReply({ id, toast }: { id: string; toast: any }) {
  const res = await deleteReply({ id });
  if (res.success) {
    toast({
      title: 'Post deleted',
      description: 'The post has been deleted.',
    });
  } else {
    toast({
      title: 'Uh oh!',
      description: 'The post could not be deleted.',
      variant: 'destructive',
    });
  }
}

export function DeleteReplyDialog({ id }: { id: string }) {
  const { toast } = useToast();
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
                removeReply({ id, toast });
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
