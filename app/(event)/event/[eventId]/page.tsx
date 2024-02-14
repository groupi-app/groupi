import { EventHeader } from "@/components/event-header";
import { MemberList } from "@/components/member-list";
import { PostFeed } from "@/components/post-feed";
import { NewPostButton } from "@/components/new-post-button";
import {
  QueryClient,
  HydrationBoundary,
  dehydrate,
} from "@tanstack/react-query";
import { fetchEventData } from "@/lib/actions/event-data";
import { notFound } from "next/navigation";
import QueryProvider from "@/components/providers/query-provider";
import { getEventQuery } from "@/lib/query-definitions";
import { EventHeaderSkeleton } from "@/components/skeletons/event-header-skeleton";
import { PostFeedSkeleton } from "@/components/skeletons/post-feed-skeleton";
import { MemberListSkeleton } from "@/components/skeletons/member-list-skeleton";

export default async function Page({
  params,
}: {
  params: { eventId: string };
}) {
  const { eventId } = params;

  const data = await fetchEventData(eventId);

  if (!data) {
    notFound();
  }

  if (data.error) {
    throw new Error(data.error);
  }

  const queryDefinition = getEventQuery(eventId);

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: [queryDefinition.queryKey],
    queryFn: async () => data,
  });

  return (
    <QueryProvider queryDefinition={queryDefinition}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <div className="container pt-6 pb-24 space-y-5">
          <EventHeader eventId={eventId} />
          <div className="max-w-4xl mx-auto flex flex-col gap-4">
            <MemberList eventId={eventId} />
            <PostFeed eventId={eventId} />
          </div>
          <NewPostButton />
        </div>
      </HydrationBoundary>
    </QueryProvider>
  );
}
