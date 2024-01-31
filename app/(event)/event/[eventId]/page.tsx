import EventHeader from "@/components/event-header";
import MemberList from "@/components/member-list";
import { db } from "@/lib/db";
import PostFeed from "@/components/post-feed";
import { UserInfo } from "@/types";
import { PostWithAuthorInfo } from "@/types";
import { clerkClient, auth } from "@clerk/nextjs";
import { NewPostButton } from "@/components/new-post-button";
import { notFound } from "next/navigation";

export default async function Page({
  params,
}: {
  params: { eventId: string };
}) {
  const { eventId } = params;
  const event = await db.event.findUnique({
    where: {
      id: eventId,
    },
    include: {
      memberships: { include: { person: true } },
      posts: {
        include: { replies: true },
      },
    },
  });

  if (!event) {
    notFound();
  }

  const { userId }: { userId: string | null } = auth();

  if (!userId) {
    throw new Error();
  }

  const role = event.memberships.find(
    (member) => member.personId === userId
  )?.role;
  if (!role) {
    throw new Error("You are not a member of this event");
  }
  const isMod = role === "MODERATOR" || role === "ORGANIZER";

  if (!event.memberships.some((membership) => membership.personId === userId)) {
    throw new Error("You are not a member of this event");
  }

  const membershipUsers = await clerkClient.users.getUserList({
    userId: event.memberships.map((membership) => membership.personId),
  });

  const members: UserInfo[] = membershipUsers.map((user) => {
    const role = event.memberships.find(
      (membership) => membership.personId === user.id
    )?.role;
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      avatar: user.imageUrl,
      role: role,
    };
  });

  let { posts }: { posts: PostWithAuthorInfo[] } = event;

  posts = posts.map((post) => {
    const author = membershipUsers.find(
      (author) => author.id === post.authorId
    );
    if (author) {
      post.authorInfo = {
        firstName: author.firstName,
        lastName: author.lastName,
        username: author.username,
        avatar: author.imageUrl,
      };
    }
    return {
      ...post,
    };
  });

  return (
    <div className="container pt-6 pb-24 space-y-5">
      <EventHeader
        eventTitle={event.title}
        eventLocation={event.location}
        eventDate={
          event.chosenDateTime
            ? event.chosenDateTime.toLocaleString([], {
                year: "numeric",
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : null
        }
        eventDescription={event.description}
      />
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <MemberList members={members} />
        <PostFeed userId={userId} isMod={isMod} posts={posts} />
      </div>
      <NewPostButton />
    </div>
  );
}
