import { EventHeader } from "@/components/event-header";
import { MemberList } from "@/components/member-list";
import { NewPostButton } from "@/components/new-post-button";
import { PostFeed } from "@/components/post-feed";
import QueryProvider from "@/components/providers/query-provider";
import { fetchEventData } from "@/lib/actions/event";
import { markEventNotifsAsRead } from "@/lib/actions/notification";
import { getEventQuery } from "@/lib/query-definitions";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { notFound, redirect } from "next/navigation";

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

  const userMembership = data.success?.event.memberships.find(
    (membership) => membership.personId === data.success?.userId
  );

  if (!userMembership) {
    throw new Error("You do not have permission to view this page.");
  }

  if (
    !data.success?.event.chosenDateTime &&
    userMembership.availabilities.length === 0
  ) {
    redirect(`/event/${eventId}/availability`);
  }

  const queryDefinition = getEventQuery(eventId);

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: [queryDefinition.queryKey],
    queryFn: async () => data,
  });

  await markEventNotifsAsRead(eventId);

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
