"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { Icons } from "./icons";
import { Member } from "@/types";
import { formatRoleBadge, formatRoleName, getFullName } from "@/lib/utils";
import { $Enums } from "@prisma/client";
import { Dialog, DialogTrigger } from "@radix-ui/react-dialog";
import { KickMemberDialog } from "./kick-member-dialog";
import {
  MemberAction,
  MemberActionDialog,
} from "@/components/member-action-dialog";
import { useState } from "react";

export default function MemberIcon({
  member,
  userRole,
  userId,
}: {
  member: Member;
  userRole: $Enums.Role;
  userId: string;
}) {
  const { firstName, lastName, username, imageUrl } = member.person;
  const role = member.role;

  const initials = firstName?.toString()[0] + "" + lastName?.toString()[0];

  const fullName = getFullName(firstName, lastName);

  const isMe = userId === member.person.id;

  const canKick =
    !isMe &&
    ((userRole === "MODERATOR" && member.role === "ATTENDEE") ||
      userRole === "ORGANIZER");

  const canPromote = !isMe && userRole === "ORGANIZER";

  const [dialogAction, setDialogAction] = useState<MemberAction>(
    MemberAction.KICK
  );

  return (
    <Dialog>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger className="rounded-full">
              <Avatar>
                <AvatarImage src={imageUrl} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-base text-card-foreground">
                  {fullName}
                </span>
                <span className="text-muted-foreground">{username}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>
              <div className="flex items-center gap-1">
                <div className="text-card-foreground">
                  {formatRoleBadge(role)}
                </div>
                <span className="text-card-foreground">
                  {formatRoleName(role)}
                </span>
              </div>
            </DropdownMenuLabel>
            {(canKick || canPromote) && <DropdownMenuSeparator />}

            {canPromote && (
              <>
                {member.role === "ATTENDEE" && (
                  <DropdownMenuItem
                    onClick={() => {
                      setDialogAction(MemberAction.PROMOTE);
                    }}
                    asChild
                    className="cursor-pointer"
                  >
                    <DialogTrigger asChild>
                      <div className="flex items-center gap-1">
                        <Icons.shield className="w-4 h-4" />
                        <span>Promote</span>
                      </div>
                    </DialogTrigger>
                  </DropdownMenuItem>
                )}

                {member.role === "MODERATOR" && (
                  <DropdownMenuItem
                    onClick={() => {
                      setDialogAction(MemberAction.DEMOTE);
                    }}
                    asChild
                    className="cursor-pointer focus:bg-destructive focus:text-destructive-foreground"
                  >
                    <DialogTrigger asChild>
                      <div className="flex items-center gap-1">
                        <Icons.shieldOff className="w-4 h-4" />
                        <span>Demote</span>
                      </div>
                    </DialogTrigger>
                  </DropdownMenuItem>
                )}
              </>
            )}
            {canKick && (
              <DropdownMenuItem
                onClick={() => {
                  setDialogAction(MemberAction.KICK);
                }}
                asChild
                className="cursor-pointer focus:bg-destructive focus:text-destructive-foreground"
              >
                <DialogTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Icons.kick className="w-4 h-4" />
                    <span>Kick</span>
                  </div>
                </DialogTrigger>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
          <MemberActionDialog action={dialogAction} member={member} />
          <TooltipContent>
            <span>{fullName != null ? fullName : username}</span>
          </TooltipContent>
        </DropdownMenu>
      </Tooltip>
    </Dialog>
  );
}
