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
import { useToast } from "./ui/use-toast";

async function deletePost({ id, toast }: { id: string; toast: any }) {
  const res = await fetch(`/api/post/${id}`, { method: "DELETE" });
  if (res.ok) {
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
                deletePost({ id, toast });
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
