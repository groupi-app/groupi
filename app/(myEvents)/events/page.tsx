import ErrorPage from "@/components/error";
import { EventList } from "@/components/event-list";
import QueryProvider from "@/components/providers/query-provider";
import { fetchPersonData } from "@/lib/actions/person";
import { getPersonQuery } from "@/lib/query-definitions";
import { auth } from "@clerk/nextjs";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { notFound } from "next/navigation";

export default async function Page() {
  const { userId }: { userId: string | null } = auth();
  if (!userId) {
    return <ErrorPage message={"User not found"} />;
  }

  const data = await fetchPersonData(userId);

  if (!data) {
    notFound();
  }

  if (data.error) {
    return <ErrorPage message={data.error} />;
  }

  const queryDefinition = getPersonQuery(userId);

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: [queryDefinition.queryKey],
    queryFn: async () => data,
  });

  return (
    <QueryProvider queryDefinition={queryDefinition}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <div className="container py-6 max-w-4xl">
          <EventList userId={userId} />
        </div>
      </HydrationBoundary>
    </QueryProvider>
  );
}
