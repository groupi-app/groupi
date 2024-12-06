import { AvailabilityChart } from "@/components/availability-chart";
import { DateCardList } from "@/components/date-card-list";
import { Icons } from "@/components/icons";
import QueryProvider from "@/components/providers/query-provider";
import { Button } from "@/components/ui/button";
import { getEventPotentialDateTimes } from "@/lib/actions/availability";
import { getPDTQuery } from "@/lib/query-definitions";
import { PotentialDateTimeWithAvailabilities } from "@/types";
import { auth } from "@clerk/nextjs";
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

  const data = await getEventPotentialDateTimes(eventId);

  if (!data) {
    notFound();
  }

  if (data.error) {
    throw new Error(data.error);
  }

  if (data.success?.userRole !== "ORGANIZER") {
    throw new Error("You do not have permission to view this page.");
  }

  const queryDefinition = getPDTQuery(eventId);

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: [queryDefinition.queryKey],
    queryFn: async () => data,
  });

  return (
    <QueryProvider queryDefinition={queryDefinition}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <div className="container max-w-5xl py-4">
          <div className="w-max my-2">
            <Link data-test="full-post-back" href={`/event/${eventId}`}>
              <Button
                variant={"ghost"}
                className="flex items-center gap-1 pl-2"
              >
                <Icons.back />
                <span>{data.success?.potentialDateTimes[0].event.title}</span>
              </Button>
            </Link>
          </div>
          <div>
            <AvailabilityChart eventId={eventId} />
            <DateCardList eventId={eventId} />
          </div>
        </div>
      </HydrationBoundary>
    </QueryProvider>
  );
}
