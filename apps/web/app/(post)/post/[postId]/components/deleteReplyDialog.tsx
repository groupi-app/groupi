'use client';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
// Migrated from server actions to tRPC hooks
import { useDeleteReply } from '@groupi/hooks';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function DeleteReplyDialog({ id }: { id: string }) {
  // Use our new tRPC hook with integrated real-time sync
  const deleteReplyMutation = useDeleteReply();

  const handleDeleteReply = () => {
    deleteReplyMutation.mutate(
      { id },
      {
        onSuccess: ([error, _result]) => {
          if (error) {
            toast.error('Failed to delete reply', {
              description: 'The reply could not be deleted. Please try again.',
            });
            return;
          }

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
              onClick={handleDeleteReply}
              disabled={deleteReplyMutation.isLoading}
              variant='destructive'
            >
              {deleteReplyMutation.isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogClose>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
