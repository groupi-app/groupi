import { EditEventMultiDate } from "@/components/edit-event-multi-date";
import { NewEventMultiDate } from "@/components/new-event-multi-date";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function Page({
  params,
}: {
  params: { eventId: string };
}) {
  const { eventId } = params;
  const res = await db.event.findUnique({
    where: { id: eventId },
    select: { potentialDateTimes: true },
  });
  if (!res) {
    notFound();
  }
  const dates = res.potentialDateTimes
    ? res.potentialDateTimes.map((pdt) => pdt.dateTime)
    : undefined;
  return (
    <div className="container max-w-4xl">
      <h1 className="text-4xl font-heading mt-10">Event Date/Time Options</h1>
      <EditEventMultiDate eventId={eventId} dates={dates} />
    </div>
  );
}
