import Link from "next/link";
import { Icons } from "./icons";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ExtendedPost } from "@/types";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { DeletePostDialog } from "./deletePostDialog";
import { formatDate, getFullName } from "@/lib/utils";
import React from "react";
import { PostCardContent } from "./post-card-content";
import { $Enums } from "@prisma/client";

interface PostCardProps {
  post: ExtendedPost;
  userRole: $Enums.Role;
  userId: string;
}

export function PostCard({ post, userRole, userId }: PostCardProps) {
  const {
    id,
    title,
    content,
    author,
    createdAt,
    updatedAt,
    replies,
    authorId,
  } = post;
  if (!author) return null;
  const initials =
    author.firstName?.toString()[0] + "" + author.lastName?.toString()[0];

  const fullName = getFullName(author.firstName, author.lastName);

  const canDelete =
    userId === authorId || userRole === "MODERATOR" || userRole === "ORGANIZER";

  return (
    <Dialog>
      <DropdownMenu>
        <div className="rounded-xl border border-border w-full relative shadow-md z-10">
          <Link href={`/post/${id}`} className="w-full z-10">
            <div className="w-full rounded-xl bg-card hover:bg-accent transition-colors group pt-4 px-5 pb-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 w-full mb-2">
                  <div>
                    <Avatar>
                      <AvatarImage src={author.imageUrl} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex flex-col -space-y-1 w-full pr-16">
                    <span className="sm:text-lg text-card-foreground truncate overflow-hidden w-full">
                      {title}
                    </span>
                    {fullName != "" ? (
                      <span className="text-sm text-muted-foreground">
                        {fullName}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {author.username}
                      </span>
                    )}
                  </div>
                </div>
                <PostCardContent content={content} />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                    <span className="text-muted-foreground text-sm">
                      Created {formatDate(createdAt)} ago
                    </span>
                    {updatedAt.toISOString() !== createdAt.toISOString() && (
                      <span className="text-muted-foreground text-sm">
                        Updated {formatDate(updatedAt)} ago
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1">
                    <Icons.reply className="w-5 h-5" />
                    <span className="text-sm">{replies.length} replies</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
          {canDelete && (
            <>
              <DropdownMenuTrigger className="absolute z-20 w-8 h-8 hover:bg-accent transition-all rounded-md top-1 right-1 flex items-center justify-center">
                <Icons.more />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {userId === authorId && (
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href={`/post/${id}/edit`}>
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
      </DropdownMenu>
      <DeletePostDialog id={id} />
    </Dialog>
  );
}

PostCard.Skeleton = function PostCardSkeleton() {
  return (
    <div className="rounded-md border border-border w-full relative shadow-md max-w-2xl">
      <div className="w-full transition-all pt-4 px-5 pb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex flex-col space-y-1">
              <Skeleton className="w-36 h-4" />
              <Skeleton className="w-16 h-3" />
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-3/4 h-4" />
          </div>
          <div className="flex items-center justify-between mt-2">
            <Skeleton className="w-16 h-4" />
            <Skeleton className="w-16 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
