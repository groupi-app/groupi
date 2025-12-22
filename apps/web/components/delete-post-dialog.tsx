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
import { useDeletePost } from '@/hooks/mutations/use-delete-post';

export function DeletePostDialog({ id }: { id: string }) {
  const router = useRouter();
  const deletePost = useDeletePost();

  const handleDeletePost = () => {
    deletePost.mutate(
      { postId: id },
      {
        onSuccess: () => {
          toast.success('The post has been deleted.');
          router.back();
        },
        onError: error => {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred. Please try again.';
          toast.error('Failed to delete post', {
            description: errorMessage,
          });
        },
      }
    );
  };

  const isLoading = deletePost.isPending;

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
        <div className='flex items-center gap-2'>
          <DialogClose asChild>
            <Button variant='ghost' disabled={isLoading}>
              Cancel
            </Button>
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
