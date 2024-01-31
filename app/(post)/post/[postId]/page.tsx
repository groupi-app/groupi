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
import { db } from "@/lib/db";
import { getFullName } from "@/lib/utils";
import { auth, clerkClient, currentUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: { postId: string } }) {
  const { postId } = params;
  const post = await db.post.findUnique({
    where: { id: postId },
    include: { author: true, event: { include: { memberships: true } } },
  });
  if (!post) {
    notFound();
  }
  const { userId }: { userId: string | null } = auth();
  if (!userId) {
    notFound();
  }
  if (
    !post.event.memberships.some((membership) => membership.personId === userId)
  ) {
    throw new Error("You are not a member of this event");
  }

  const membership = post.event.memberships.find(
    (membership) => membership.personId === userId
  );
  if (!membership) {
    throw new Error("You are not a member of this event");
  }
  const role = membership.role;
  const isMod = role === "MODERATOR" || role === "ORGANIZER";

  const authorUser = await clerkClient.users.getUser(post.author.id);
  const fullName = getFullName(authorUser.firstName, authorUser.lastName);

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
                <span>{post.event.title}</span>
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
              <h1 className="text-5xl font-heading">{post.title}</h1>
              <div className="flex items-center gap-2">
                <Image
                  src={authorUser.imageUrl}
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
