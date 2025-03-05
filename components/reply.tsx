"use client";

import { updateReply } from "@/lib/actions/reply";
import { cn, formatDate } from "@/lib/utils";
import { Member } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { $Enums, Reply } from "@prisma/client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DeleteReplyDialog } from "./deleteReplyDialog";
import { Icons } from "./icons";
import MemberIcon from "./member-icon";
import { Button } from "./ui/button";
import { Dialog, DialogTrigger } from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem } from "./ui/form";
import { Textarea } from "./ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useToast } from "./ui/use-toast";

const formSchema = z.object({
  reply: z
    .string()
    .min(1, "Reply must be at least 1 character")
    .max(350, "Reply must be 350 characters or less"),
});

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
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      reply: reply.text,
    },
  });
  const isMe = userId === reply.authorId;
  const canDelete =
    isMe || userRole === "MODERATOR" || userRole === "ORGANIZER";

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    const res = await updateReply({ replyId: reply.id, text: values.reply });
    if (res.success) {
      toast({
        title: "Reply updated",
        description: "Your reply has been successfully updated",
      });
    } else {
      toast({
        title: "Failed to update reply",
        description: "The reply was unable to be updated.",
      });
    }
    setIsSaving(false);
    setEditMode(false);
  }

  const name =
    member?.person.firstName ??
    member?.person.lastName ??
    member?.person.username;

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
              key={member.id}
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
              "rounded-lg max-w-xl px-4 pb-4 min-w-0 break-words relative",
              canDelete ? "pr-12" : "",
              isMe
                ? "bg-primary text-primary-foreground pt-4"
                : "bg-muted text-foreground",
              editMode ? "w-full" : ""
            )}
          >
            {!isMe && (
              <div className="text-xs text-muted-foreground pt-2">{name}</div>
            )}
            {canDelete && (
              <>
                <DropdownMenuTrigger
                  className={cn(
                    "absolute z-20 w-8 h-8 transition-all rounded-md hover:bg-muted top-3 right-2 flex items-center justify-center",
                    isMe ? "hover:bg-accent/10" : "hover:bg-muted-foreground/10"
                  )}
                >
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
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <FormField
                    control={form.control}
                    name="reply"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormControl>
                          <div className="relative">
                            <Textarea
                              className="bg-background/10 pr-6 "
                              {...field}
                            />
                            <div className="flex flex-col items-center absolute top-1 right-1">
                              <Tooltip>
                                <TooltipTrigger>
                                  <Button
                                    className="w-6 h-6 p-1"
                                    variant="ghost"
                                    type="submit"
                                  >
                                    {isSaving ? (
                                      <Icons.spinner className="animate-spin" />
                                    ) : (
                                      <Icons.check />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Save</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Button
                                    className="w-6 h-6 p-1"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditMode(false);
                                      form.reset({ reply: reply.text });
                                    }}
                                  >
                                    <Icons.close />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Cancel</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            ) : (
              <p className="whitespace-pre-wrap">{reply.text}</p>
            )}

            <div className="text-xs text-primary-foreground/60">
              {formatDate(reply.createdAt)}
            </div>
          </div>
        </div>
      </DropdownMenu>
      <DeleteReplyDialog id={reply.id} />
    </Dialog>
  );
}
