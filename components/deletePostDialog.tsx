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
import { useToast } from './ui/use-toast';

async function removePost({
  id,
  toast,
  router,
}: {
  id: string;
  toast: any;
  router: AppRouterInstance;
}) {
  const res = await deletePost({ id });
  if (res.success) {
    router.push(`/event/${res.success.post.eventId}`);
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

export function DeletePostDialog({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
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
                removePost({ id, toast, router });
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
