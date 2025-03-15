"use client";

import { DeletePostDialog } from "@/components/deletePostDialog";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePostData } from "@/data/post-hooks";
import { getFullName } from "@/lib/utils";
import { ReplyAuthorEventPost } from "@/types";
import { $Enums } from "@prisma/client";
import Link from "next/link";
import ErrorPage from "./error";
import MemberIcon from "./member-icon";

export function FullPost({ postId }: { postId: string }) {
  const { data: postData } = usePostData(postId);

  const {
    post,
    isMod,
    userId,
    userRole,
  }: {
    post: ReplyAuthorEventPost;
    isMod: boolean;
    userId: string;
    userRole: $Enums.Role;
  } = postData;

  const { event, author } = post;

  if (!userRole) {
    return <ErrorPage message={"You are not a member of this event."} />;
  }

  const member = post.event.memberships.find(
    (m) => m.personId === post.authorId
  );

  const fullName = getFullName(author.firstName, author.lastName);

  return (
    <Dialog>
      <DropdownMenu>
        <div className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <Link data-test="full-post-back" href={`/event/${post.eventId}`}>
              <Button
                variant={"ghost"}
                className="flex items-center gap-1 pl-2"
              >
                <Icons.back />
                <span>{event.title}</span>
              </Button>
            </Link>
            {(isMod || userId === post.authorId) && (
              <>
                <DropdownMenuTrigger className="w-8 h-8 hover:bg-accent transition-all rounded-md flex items-center justify-center">
                  <Icons.more />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {userId === post.authorId && (
                    <DropdownMenuItem className="cursor-pointer" asChild>
                      <Link href={`/post/${post.id}/edit`}>
                        <div className="flex items-center gap-1">
                          <Icons.edit className="w-4 h-4" />
                          <span>Edit</span>
                        </div>
                      </Link>
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
          </div>
          <div>
            <div className="flex flex-col gap-1 mb-8">
              <h1
                data-test="full-post-title"
                className="text-5xl font-heading font-medium mb-1"
              >
                {post.title}
              </h1>
              <div className="flex items-center gap-2">
                {member ? (
                  <MemberIcon
                    key={member.id}
                    userId={userId}
                    userRole={userRole}
                    member={member}
                    eventDateTime={event.chosenDateTime}
                    align="start"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary" />
                )}

                <span className="text-muted-foreground">{fullName}</span>
              </div>
              <div className="text-muted-foreground text-sm flex flex-col gap-1">
                <span>
                  Created{" "}
                  {post.createdAt.toLocaleString([], {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {post.updatedAt.toISOString() !==
                  post.createdAt.toISOString() && (
                  <span>
                    Edited{" "}
                    {post.editedAt.toLocaleString([], {
                      year: "numeric",
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            </div>
            <div
              data-test="full-post-content"
              className="whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </div>
      </DropdownMenu>
      <DeletePostDialog id={post.id} />
    </Dialog>
  );
}
