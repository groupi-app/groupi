import EventHeader from "@/components/event-header";
import MemberList from "@/components/member-list";
import { db } from "@/lib/db";
import PostFeed from "@/components/post-feed";
import { UserInfo } from "@/types";
import { PostWithAuthorInfo } from "@/types";
import { clerkClient, auth } from "@clerk/nextjs";
import { NewPostButton } from "@/components/new-post-button";
import { notFound } from "next/navigation";
import {
  QueryClient,
  HydrationBoundary,
  dehydrate,
} from "@tanstack/react-query";
import { fetchEventData } from "@/lib/actions/event-data";
import { cache } from "react";

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

  if (!event.memberships.some((membership) => membership.personId === userId)) {
    throw new Error("You are not a member of this event");
  }

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["eventData"],
    queryFn: async () => fetchEventData(eventId),
  });

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
      <HydrationBoundary state={dehydrate(queryClient)}>
        <EventHeader eventId={eventId} />
      </HydrationBoundary>
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <MemberList eventId={eventId} />
          <PostFeed eventId={eventId} />
        </HydrationBoundary>
      </div>
      <NewPostButton />
    </div>
  );
}
