"use client";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteMembership, updateMembershipRole } from "@/lib/actions/member";
import { Member } from "@/types";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";

export enum MemberAction {
  KICK = "KICK",
  DEMOTE = "DEMOTE",
  PROMOTE = "PROMOTE",
}

async function demoteMember({ member, toast }: { member: Member; toast: any }) {
  const res = await updateMembershipRole({
    membership: member,
    role: "ATTENDEE",
  });
  if (res.success) {
    toast({
      title: "Moderator demoted",
      description: "The moderator has been demoted to a normal attendee.",
    });
  } else {
    toast({
      title: "Uh oh!",
      description: "The moderator could not be demoted.",
      variant: "destructive",
    });
  }
}

async function promoteMember({
  member,
  toast,
}: {
  member: Member;
  toast: any;
}) {
  const res = await updateMembershipRole({
    membership: member,
    role: "MODERATOR",
  });
  if (res.success) {
    toast({
      title: "Attendee promoted",
      description: "The attendee has been promoted to a moderator.",
    });
  } else {
    toast({
      title: "Uh oh!",
      description: "The attendee could not be promoted.",
      variant: "destructive",
    });
  }
}

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

export function MemberActionDialog({
  member,
  action,
}: {
  member: Member;
  action: MemberAction;
}) {
  const { toast } = useToast();
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {action === MemberAction.KICK
            ? "Kick Attendee?"
            : action === MemberAction.DEMOTE
            ? "Demote Moderator?"
            : action === MemberAction.PROMOTE
            ? "Promote Attendee?"
            : ""}
        </DialogTitle>
        <DialogDescription>
          {action === MemberAction.KICK
            ? "Are you sure you want to kick this attendee? They will need to be invited again to rejoin."
            : action === MemberAction.DEMOTE
            ? "Are you sure you want to demote this moderator? They will be unable to delete posts or kick/ban attendees."
            : action === MemberAction.PROMOTE
            ? "Are you sure you want to promote this attendee? They will be able to delete posts and kick/ban attendees."
            : ""}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <div className="flex items-center gap-2">
          <DialogClose className="grow" asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <DialogClose className="grow" asChild>
            <Button
              onClick={() => {
                if (action === MemberAction.KICK) {
                  kickMember({ member, toast });
                } else if (action === MemberAction.DEMOTE) {
                  demoteMember({ member, toast });
                } else if (action === MemberAction.PROMOTE) {
                  promoteMember({ member, toast });
                }
              }}
              className="w-full"
              variant={
                action === MemberAction.PROMOTE ? "default" : "destructive"
              }
            >
              {action === MemberAction.KICK
                ? "Kick"
                : action === MemberAction.DEMOTE
                ? "Demote"
                : action === MemberAction.PROMOTE
                ? "Promote"
                : ""}
            </Button>
          </DialogClose>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
