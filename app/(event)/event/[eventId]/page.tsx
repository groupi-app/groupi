import EventHeader from "@/components/event-header";
import MemberList from "@/components/member-list";
import { db } from "@/lib/db";
import PostFeed from "@/components/post-feed";
import { UserInfo } from "@/types";
import { PostWithReplies } from "@/types";
import { clerkClient } from "@clerk/nextjs";
import { NewPostButton } from "@/components/new-post-button";

export default async function Page({
  params,
}: {
  params: { eventId: string };
}) {
  const { eventId } = params;

  const eventInfo = {
    title: "Telly's Birthday Party",
    location: "42 Wellman St Apt 125, Lowell, MA 01851",
    date: "September 3, 2023 at 3:00 PM",
    description:
      "Come celebrate Telly's birthday! There will be cake and lots of fun!",
  };

  let posts: PostWithReplies[] = await db.post.findMany({
    where: {
      eventId: eventId,
    },
    include: {
      replies: { select: { id: true } },
    },
  });
  const postAuthorIds = posts.map((post) => post.authorId);
  const authors = await clerkClient.users.getUserList({
    userId: postAuthorIds,
  });
  posts = posts.map((post) => {
    const author = authors.find((author) => author.id === post.authorId);
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
        eventTitle={eventInfo.title}
        eventLocation={eventInfo.location}
        eventDate={eventInfo.date}
        eventDescription={eventInfo.description}
      />
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <MemberList />
        <PostFeed posts={posts} />
      </div>
      <NewPostButton />
    </div>
  );
}
