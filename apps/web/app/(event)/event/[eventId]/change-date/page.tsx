import { ChangeDateContent } from './components/change-date-content';

export default async function EventChangeDatePage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = await props.params;
  const { eventId } = params;

  return <ChangeDateContent eventId={eventId} />;
}
