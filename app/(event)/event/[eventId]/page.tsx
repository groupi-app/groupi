"use client";

import { useToast } from "@/components/ui/use-toast";

export default function Page({ params }) {
  const { eventId } = params;
  const { toast } = useToast();
  return (
    <div>
      <h1>Event: {eventId}</h1>
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
