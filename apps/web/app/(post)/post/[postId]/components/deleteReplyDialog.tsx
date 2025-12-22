'use client';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useDeleteReply } from '@/hooks/mutations/use-delete-reply';

export function DeleteReplyDialog({ id }: { id: string }) {
  const deleteReply = useDeleteReply();

  const handleDeleteReply = () => {
    deleteReply.mutate(
      { replyId: id },
      {
        onSuccess: () => {
          toast.success('The reply has been deleted.');
        },
        onError: () => {
          toast.error('Failed to delete reply', {
            description: 'An unexpected error occurred. Please try again.',
          });
        },
      }
    );
  };

  const isLoading = deleteReply.isPending;

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
