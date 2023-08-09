"use client";

import { useToast } from "@/components/ui/use-toast";
import { PostCard } from "@/components/post-card";

export default function Page({ params }) {
  const { eventId } = params;
  const { toast } = useToast();
  return (
    <div className="container py-12">
      <h1>Event: {eventId}</h1>
      <div className="max-w-xl flex flex-col items-center w-96">
        <PostCard />
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
