import { EditEventContent } from './components/edit-event-content';

export default async function EventEditPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = await props.params;
  const { eventId } = params;

  return <EditEventContent eventId={eventId} />;
}
