import { EditEventSingleDate } from "@/components/edit-event-single-date";
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
    select: { chosenDateTime: true },
  });
  if (!res) {
    notFound();
  }
  const datetime = res.chosenDateTime ?? undefined;
  return (
    <div className="container max-w-4xl">
      <h1 className="text-4xl font-heading mt-10">Event Date/Time</h1>
      <EditEventSingleDate eventId={eventId} datetime={datetime} />
    </div>
  );
}
