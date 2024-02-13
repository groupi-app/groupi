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
import Image from "next/image";
import Link from "next/link";

export function FullPost({ postId }: { postId: string }) {
  const { data: postData } = usePostData(postId);

  const {
    post,
    isMod,
    userId,
  }: { post: ReplyAuthorEventPost; isMod: boolean; userId: string } = postData;

  const { event, author } = post;

  const fullName = getFullName(author.firstName, author.lastName);

  return (
    <Dialog>
      <DropdownMenu>
        <div className="container pt-6">
          <div className="flex items-center justify-between mb-4">
            <Link href={`/event/${post.eventId}`}>
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
              <h1 className="text-5xl font-heading font-medium">
                {post.title}
              </h1>
              <div className="flex items-center gap-2">
                <Image
                  src={author.imageUrl}
                  alt={fullName}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-muted-foreground">{fullName}</span>
              </div>
            </div>
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </div>
      </DropdownMenu>
      <DeletePostDialog id={post.id} />
    </Dialog>
  );
}
