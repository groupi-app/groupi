"use client";

import {
  cn,
  formatRoleBadge,
  formatRoleName,
  getFullName,
  getInitials,
} from "@/lib/utils";
import { Member } from "@/types";
import { $Enums } from "@prisma/client";
import { Dialog, DialogTrigger } from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { Icons } from "./icons";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

import {
  MemberAction,
  MemberActionDialog,
} from "@/components/member-action-dialog";
import { useState } from "react";

const item = {
  hidden: { opacity: 0, x: 15 },
  show: { opacity: 1, x: 0 },
};

export default function MemberIcon({
  member,
  userRole,
  userId,
  itemKey,
  className,
  align,
  eventDateTime,
}: {
  member: Member;
  userRole: $Enums.Role;
  userId: string;
  itemKey: string;
  className?: string;
  align?: "start" | "center" | "end";
  eventDateTime: Date | null;
}) {
  const { firstName, lastName, username, imageUrl } = member.person;
  const role = member.role;

  const initials = getInitials(firstName, lastName);

  const fullName = getFullName(firstName, lastName);

  console.log(fullName);

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
    <motion.div
      variants={item}
      className={cn(
        "flex items-center rounded-full border-2 border-background hover:border-primary transition-colors z-10",
        className
      )}
      layout
      key={itemKey}
    >
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
            <DropdownMenuContent align={align}>
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
              {eventDateTime && (
                <DropdownMenuLabel>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <span>RSVP: </span>
                    {member.rsvpStatus === "YES" && (
                      <Icons.check className="text-green-500" />
                    )}
                    {member.rsvpStatus === "MAYBE" && (
                      <span className="font-semibold w-6 text-xl text-yellow-500 text-center">
                        ?
                      </span>
                    )}
                    {member.rsvpStatus === "NO" && (
                      <Icons.close className="text-red-500" />
                    )}
                    <span className="text-foreground">{member.rsvpStatus}</span>
                  </div>
                </DropdownMenuLabel>
              )}

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
                          <Icons.shield className="size-4" />
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
                          <Icons.shieldOff className="size-4" />
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
                      <Icons.kick className="size-4" />
                      <span>Kick</span>
                    </div>
                  </DialogTrigger>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
            <MemberActionDialog action={dialogAction} member={member} />
            <TooltipContent>
              <span>{fullName != "" ? fullName : username}</span>
            </TooltipContent>
          </DropdownMenu>
        </Tooltip>
      </Dialog>
    </motion.div>
  );
}
