import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { clerkClient } from "@clerk/nextjs";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: { postId: string } }) {
  const { postId } = params;
  const post = await db.post.findUnique({
    where: { id: postId },
    include: { author: true, event: true },
  });
  if (!post) {
    notFound();
  }
  const authorUser = await clerkClient.users.getUser(post.author.id);
  let fullName = "";
  if (authorUser.firstName && authorUser.lastName) {
    fullName = authorUser.firstName + " " + authorUser.lastName;
  } else if (authorUser.firstName && !authorUser.lastName) {
    fullName = authorUser.firstName;
  } else if (!authorUser.firstName && authorUser.lastName) {
    fullName = authorUser.lastName;
  }

  return (
    <div className="container pt-6">
      <Link href={`/event/${post.eventId}`}>
        <Button variant={"ghost"} className="flex items-center gap-1 pl-2 mb-4">
          <Icons.back />
          <span>Back</span>
        </Button>
      </Link>
      <div>
        <div className="flex flex-col gap-1 mb-8">
          <h1 className="text-5xl font-heading">{post.title}</h1>
          <div className="flex items-center gap-2">
            <img
              src={authorUser.imageUrl}
              alt={fullName}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-muted-foreground">{fullName}</span>
          </div>
        </div>
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>
    </div>
  );
}
