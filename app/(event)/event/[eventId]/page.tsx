"use client";

import { useToast } from "@/components/ui/use-toast";
import { PostCard } from "@/components/post-card";
import { UserInfo } from "@/types";

export default function Page({ params }) {
  const { eventId } = params;
  const { toast } = useToast();
  const userInfo: UserInfo = {
    firstName: "John",
    lastName: "Doe",
    username: "johndoe",
    avatar: "https://i.pravatar.cc/150?img=68",
  };
  return (
    <div className="container py-12">
      <h1>Event: {eventId}</h1>
      <div className="w-full flex flex-col items-center">
        <PostCard userInfo={userInfo} />
      </div>
      <button
        onClick={() => {
          toast({ title: "Toast", description: "This is a toast!" });
        }}
      >
        Toast
      </button>
    </div>
  );
}
