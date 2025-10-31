'use client';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { deleteReplyAction } from '@/actions/reply-actions';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';

export function DeleteReplyDialog({ id }: { id: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteReply = async () => {
    setIsLoading(true);
    const [error] = await deleteReplyAction({ replyId: id });

    if (error) {
      toast.error('Failed to delete reply', {
        description: 'An unexpected error occurred. Please try again.',
      });
      setIsLoading(false);
    } else {
      toast.success('The reply has been deleted.');
    }
  };

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
            <Button variant='ghost' disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              onClick={handleDeleteReply}
              disabled={isLoading}
              variant='destructive'
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogClose>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
