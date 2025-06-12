'use client';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { deletePost } from '@/lib/actions/post';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { toast } from 'sonner';

async function removePost({
  id,
  router,
}: {
  id: string;
  router: AppRouterInstance;
}) {
  const res = await deletePost({ id });
  if (res.success) {
    router.push(`/event/${res.success.post.eventId}`);
    toast.success('The post has been deleted.');
  } else {
    toast.error('The post could not be deleted.');
  }
}

export function DeletePostDialog({ id }: { id: string }) {
  const router = useRouter();
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
              onClick={() => {
                removePost({ id, router });
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
