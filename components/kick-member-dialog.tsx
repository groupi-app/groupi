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
import { deleteMembership } from "@/lib/actions/member";
import { Member } from "@/types";

async function kickMember({ member, toast }: { member: Member; toast: any }) {
  const res = await deleteMembership(member);
  if (res.success) {
    toast({
      title: "Attendee kicked",
      description: "The attendee has been kicked from the event.",
    });
  } else {
    toast({
      title: "Uh oh!",
      description: "The attendee could not be kicked.",
      variant: "destructive",
    });
  }
}

export function KickMemberDialog({ member }: { member: Member }) {
  const { toast } = useToast();
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Kick Attendee?</DialogTitle>
        <DialogDescription>
          Are you sure you want to kick this attendee? They will need to be
          invited again to rejoin.
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
                kickMember({ member, toast });
              }}
              className="w-full"
              variant="destructive"
            >
              Kick
            </Button>
          </DialogClose>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
