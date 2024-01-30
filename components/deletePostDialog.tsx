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
import { useRouter } from "next/navigation";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context";
import { useToast } from "./ui/use-toast";

async function deletePost({
  id,
  router,
  toast,
}: {
  id: string;
  router: AppRouterInstance;
  toast: any;
}) {
  const res = await fetch(`/api/post/${id}`, { method: "DELETE" });
  if (res.ok) {
    router.refresh();
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
        <div className="flex items-center gap-2">
          <DialogClose className="flex-grow" asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <DialogClose className="flex-grow" asChild>
            <Button
              onClick={() => {
                deletePost({ id, router, toast });
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
