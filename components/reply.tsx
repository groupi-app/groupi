"use client";

import { cn, formatDate } from "@/lib/utils";
import { $Enums, Reply } from "@prisma/client";
import { Member } from "@/types";
import MemberIcon from "./member-icon";
import {
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenu,
} from "./ui/dropdown-menu";
import { Icons } from "./icons";
import { Dialog, DialogTrigger } from "./ui/dialog";
import { useState } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Form } from "./ui/form";

export default function Reply({
  reply,
  member,
  userId,
  userRole,
}: {
  reply: Reply;
  member: Member | undefined;
  userId: string;
  userRole: $Enums.Role;
}) {
  const [editMode, setEditMode] = useState(false);
  const isMe = userId === reply.authorId;
  const canDelete =
    isMe || userRole === "MODERATOR" || userRole === "ORGANIZER";
  return (
    <Dialog>
      <DropdownMenu>
        <div
          className={cn(
            "flex items-center gap-2",
            isMe ? "flex-row-reverse -mr-4" : "-ml-4"
          )}
        >
          {member ? (
            <MemberIcon
              key={0}
              userId={userId}
              userRole={userRole}
              member={member}
              align={isMe ? "end" : "start"}
            />
          ) : (
            <div className="rounded-full w-10 h-10 bg-primary" />
          )}

          <div
            className={cn(
              "rounded-lg xl:max-w-3xl lg:max-w-2xl max-w-xl p-4 min-w-0 break-words relative ",
              canDelete ? "pr-12" : "",
              isMe
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            )}
          >
            {canDelete && (
              <>
                <DropdownMenuTrigger className="absolute z-20 w-8 h-8 hover:bg-accent transition-all rounded-md top-3 right-2 flex items-center justify-center">
                  <Icons.more />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isMe && (
                    <DropdownMenuItem
                      onClick={() => setEditMode(true)}
                      className="cursor-pointer"
                      asChild
                    >
                      <div className="flex items-center gap-1">
                        <Icons.edit className="w-4 h-4" />
                        <span>Edit</span>
                      </div>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer focus:bg-destructive focus:text-destructive-foreground"
                  >
                    <DialogTrigger asChild>
                      <div className="flex items-center gap-1">
                        <Icons.delete className="w-4 h-4" />
                        <span>Delete</span>
                      </div>
                    </DialogTrigger>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </>
            )}
            {editMode ? (
              <div className="relative">
                <Textarea
                  className="bg-background/10 pr-6  resize-none "
                  defaultValue={reply.text}
                />
                <Button
                  className="w-6 h-6 p-1 absolute top-1 right-1"
                  variant="ghost"
                >
                  <Icons.check />
                </Button>
              </div>
            ) : (
              <p>{reply.text}</p>
            )}

            <div className="text-xs text-primary-foreground/60">
              {formatDate(reply.createdAt)}
            </div>
          </div>
        </div>
      </DropdownMenu>
    </Dialog>
  );
}
