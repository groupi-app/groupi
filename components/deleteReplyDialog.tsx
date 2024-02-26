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
import { deleteReply } from "@/lib/actions/reply";
import { useRouter } from "next/navigation";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

async function removeReply({
  id,
  toast,
  router,
}: {
  id: string;
  toast: any;
  router: AppRouterInstance;
}) {
  const res = await deleteReply({ id });
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

export function DeleteReplyDialog({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
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
        <div className="flex items-center gap-2">
          <DialogClose className="flex-grow" asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <DialogClose className="flex-grow" asChild>
            <Button
              onClick={() => {
                removeReply({ id, toast, router });
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
