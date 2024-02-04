"use client";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { deletePost } from "@/lib/actions/post";

async function removePost({ id, toast }: { id: string; toast: any }) {
  const res = await deletePost({ id });
  if (res.success) {
    toast({
      title: "Post deleted",
      description: "The post has been deleted.",
    });
  } else {
    toast({
      title: "Uh oh!",
      description: "The post could not be deleted.",
      variant: "destructive",
    });
  }
}

export function DeletePostDialog({ id }: { id: string }) {
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
        <div className="flex items-center gap-2">
          <DialogClose className="flex-grow" asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <DialogClose className="flex-grow" asChild>
            <Button
              onClick={() => {
                removePost({ id, toast });
              }}
              className="w-full"
              variant="destructive"
            >
              Delete
            </Button>
          </DialogClose>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
