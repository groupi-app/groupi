import { DateSelectContent } from './components/date-select-content';

export default async function EventDateSelectPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = await props.params;
  const { eventId } = params;

  return <DateSelectContent eventId={eventId} />;
}
