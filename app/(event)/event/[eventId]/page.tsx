import EventHeader from "@/components/event-header";
import MemberIcon from "@/components/member-icon";
import { PostCard } from "@/components/post-card";
import PostFeed from "@/components/post-feed";
import { UserInfo } from "@/types";
import { Post } from "@/types";
import Link from "next/link";

export default async function Page({
  params,
}: {
  params: { eventId: string };
}) {
  const { eventId } = params;
  const userInfo: UserInfo = {
    firstName: "John",
    lastName: "Doe",
    username: "johndoe",
    avatar: "https://i.pravatar.cc/150?img=68",
  };

  const eventInfo = {
    title: "Telly's Birthday Party",
    location: "42 Wellman St Apt 125, Lowell, MA 01851",
    date: "September 3, 2023 at 3:00 PM",
    description:
      "Come celebrate Telly's birthday! There will be cake and lots of fun!",
  };

  const testPost: Post = {
    id: "1",
    title: "Food accomodations",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, se do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    author: {
      firstName: "John",
      lastName: "Doe",
      username: "johndoe",
      avatar: "https://i.pravatar.cc/150?img=68",
    },
    createdAt: "35m ago",
    replies: "3 replies",
  };

  let testPosts: Post[] = [testPost, testPost, testPost, testPost];
  return (
    <div className="container pt-6 pb-12 space-y-5">
      <EventHeader
        eventTitle={eventInfo.title}
        eventLocation={eventInfo.location}
        eventDate={eventInfo.date}
        eventDescription={eventInfo.description}
      />
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-heading">Attendees</h2>
        <div className="flex items-center py-2 gap-2 flex-wrap">
          <MemberIcon />
          <MemberIcon />
          <MemberIcon />
          <MemberIcon />
          <MemberIcon />
          <MemberIcon />
          <MemberIcon />
          <MemberIcon />
          <MemberIcon />
          <MemberIcon />
          <MemberIcon />
          <MemberIcon />
          <MemberIcon />
          <MemberIcon />
          <MemberIcon />
          <MemberIcon />
          <MemberIcon />
          <MemberIcon />
        </div>
        <Link href={"/event/id/attendees"}>
          <span className="text-primary hover:underline">View All</span>
        </Link>
      </div>
      <PostFeed posts={testPosts} />
    </div>
  );
}
