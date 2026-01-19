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
import { useDeletePost } from '@/hooks/convex/use-posts';
import { Id } from '@/convex/_generated/dataModel';

export function DeletePostDialog({ id, eventId }: { id: string; eventId?: Id<"events"> }) {
  const router = useRouter();
  const deletePost = useDeletePost(eventId);

  const handleDeletePost = async () => {
    try {
      await deletePost(id as Id<'posts'>);
      // Navigate to event page instead of router.back() to avoid
      // going to unexpected pages (like new post page after creation)
      if (eventId) {
        router.push(`/event/${eventId}`);
      } else {
        router.back();
      }
      // No success toast - instant removal is feedback enough
    } catch (error) {
      // Error toast is handled by the hook
      console.error('Failed to delete post:', error);
    }
  };

  // For now, we'll assume not loading (Convex hooks don't expose loading state the same way)
  const isLoading = false;

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
