import { EditEventSingleDate } from "@/components/edit-event-single-date";

export default function Page({ params }: { params: { eventId: string } }) {
  const { eventId } = params;
  return (
    <div className="container max-w-4xl">
      <h1 className="text-4xl font-heading mt-10">Event Date/Time</h1>
      <EditEventSingleDate eventId={eventId} />
    </div>
  );
}
