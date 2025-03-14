import ErrorPage from "@/components/error";
import { Icons } from "@/components/icons";
import { InviteCardList } from "@/components/invite-card-list";
import QueryProvider from "@/components/providers/query-provider";
import { Button } from "@/components/ui/button";
import { getEventInviteData } from "@/lib/actions/invite";
import { getInviteQuery } from "@/lib/query-definitions";
import { auth } from "@clerk/nextjs";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import Link from "next/link";

export default async function Page({
  params,
}: {
  params: { eventId: string };
}) {
  const { eventId } = params;
  const { userId }: { userId: string | null } = auth();

  if (!userId) {
    return <ErrorPage message={"User not found"} />;
  }

  const data = await getEventInviteData(eventId);

  if (!data) {
    return <ErrorPage message={"Event not found"} />;
  }

  if (data.error) {
    return <ErrorPage message={data.error} />;
  }

  const event = data.success;

  const queryDefinition = getInviteQuery(eventId);

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: [queryDefinition.queryKey],
    queryFn: async () => data,
  });

  return (
    <div className="container max-w-5xl py-4">
      <Link href={`/event/${eventId}`}>
        <Button variant={"ghost"} className="flex items-center gap-1 pl-2">
          <Icons.back />
          <span>{event?.title}</span>
        </Button>
      </Link>
      <QueryProvider queryDefinition={queryDefinition}>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <InviteCardList eventId={eventId} />
        </HydrationBoundary>
      </QueryProvider>
    </div>
  );
}
