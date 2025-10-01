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
import { useDeletePost } from '@groupi/hooks';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function DeletePostDialog({ id }: { id: string }) {
  const router = useRouter();
  // Use our new tRPC hook with integrated real-time sync
  const { deletePost, isLoading } = useDeletePost();

  const handleDeletePost = () => {
    deletePost(id, {
      onSuccess: () => {
        toast.success('The post has been deleted.');
        router.back();
      },
      onError: () => {
        toast.error('Failed to delete post', {
          description: 'An unexpected error occurred. Please try again.',
        });
      },
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete Post?</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete this post? This action cannot be
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
              onClick={handleDeletePost}
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
