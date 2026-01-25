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
import { useDeleteReply } from '@/hooks/convex/use-replies';
import { useState } from 'react';
import { Id } from '@/convex/_generated/dataModel';

export function DeleteReplyDialog({
  id,
  postId,
}: {
  id: Id<'replies'>;
  postId?: Id<'posts'>;
}) {
  const deleteReply = useDeleteReply(postId);
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteReply = async () => {
    setIsLoading(true);
    try {
      await deleteReply(id);
      // No success toast - instant removal is feedback enough
    } catch {
      // Error toast is handled by the hook
    } finally {
      setIsLoading(false);
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
