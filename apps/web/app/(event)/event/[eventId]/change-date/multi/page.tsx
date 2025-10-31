import { ChangeDateMultiContent } from './components/change-date-multi-content';

export default async function EventChangeDateMultiPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = await props.params;
  const { eventId } = params;

  return <ChangeDateMultiContent eventId={eventId} />;
}
