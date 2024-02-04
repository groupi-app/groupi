import EventHeader from "@/components/event-header";
import MemberList from "@/components/member-list";
import PostFeed from "@/components/post-feed";
import { NewPostButton } from "@/components/new-post-button";
import {
  QueryClient,
  HydrationBoundary,
  dehydrate,
} from "@tanstack/react-query";
import { EventData, fetchEventData } from "@/lib/actions/event-data";
import { notFound } from "next/navigation";

export default async function Page({
  params,
}: {
  params: { eventId: string };
}) {
  const { eventId } = params;

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["eventData"],
    queryFn: async () => fetchEventData(eventId),
  });

  const data: EventData | undefined = queryClient.getQueryData(["eventData"]);

  if (!data) {
    notFound();
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="container pt-6 pb-24 space-y-5">
        <EventHeader eventId={eventId} />
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          <MemberList eventId={eventId} />
          <PostFeed eventId={eventId} />
        </div>
        <NewPostButton />
      </div>
    </HydrationBoundary>
  );
}
