import { AttendeeCount } from "@/components/attendee-count";
import { AttendeeList } from "@/components/attendee-list";
import ErrorPage from "@/components/error";
import { Icons } from "@/components/icons";
import QueryProvider from "@/components/providers/query-provider";
import { Button } from "@/components/ui/button";
import { fetchEventData } from "@/lib/actions/event";
import { getEventQuery } from "@/lib/query-definitions";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import Link from "next/link";
import { notFound } from "next/navigation";

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
    return <ErrorPage message={data.error} />;
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
        <div className="container max-w-4xl py-4">
          <div className="w-max">
            <Link data-test="full-post-back" href={`/event/${eventId}`}>
              <Button
                variant={"ghost"}
                className="flex items-center gap-1 pl-2"
              >
                <Icons.back />
                <span>{data.success?.event.title}</span>
              </Button>
            </Link>
          </div>
          <div className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="font-heading text-4xl">Attendees</h1>
              <h1 className="font-heading text-4xl text-muted-foreground">
                ({data.success?.event.memberships.length})
              </h1>
            </div>
            <AttendeeCount eventId={eventId} />
            <AttendeeList eventId={eventId} />
          </div>
        </div>
      </HydrationBoundary>
    </QueryProvider>
  );
}
