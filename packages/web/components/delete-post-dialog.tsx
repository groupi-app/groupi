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

export function DeletePostDialog({
  id,
  eventId,
}: {
  id: string;
  eventId?: Id<'events'>;
}) {
  const router = useRouter();
  const deletePost = useDeletePost(eventId);

  const handleDeletePost = () => {
    // Start deletion first - this triggers the optimistic update immediately
    // (synchronously removes post from cache before the promise resolves)
    const deletePromise = deletePost(id as Id<'posts'>);

    // Navigate to event page - the optimistic update has already removed the post
    if (eventId) {
      router.push(`/event/${eventId}`);
    } else {
      router.back();
    }

    // Handle errors in background (success doesn't need toast - instant removal is feedback enough)
    deletePromise.catch(error => {
      // Error toast is handled by the hook
      console.error('Failed to delete post:', error);
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
        <div className='flex items-center gap-2'>
          <DialogClose asChild>
            <Button variant='ghost'>Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={handleDeletePost} variant='destructive'>
              Delete
            </Button>
          </DialogClose>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
