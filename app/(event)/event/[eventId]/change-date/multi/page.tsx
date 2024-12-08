import { EditEventMultiDate } from "@/components/edit-event-multi-date";
import { NewEventMultiDate } from "@/components/new-event-multi-date";

export default function Page({ params }: { params: { eventId: string } }) {
  const { eventId } = params;
  return (
    <div className="container max-w-4xl">
      <h1 className="text-4xl font-heading mt-10">Event Date/Time Options</h1>
      <EditEventMultiDate eventId={eventId} />
    </div>
  );
}
