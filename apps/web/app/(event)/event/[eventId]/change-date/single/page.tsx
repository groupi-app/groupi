import { ChangeDateSingleContent } from './components/change-date-single-content';

export default async function EventChangeDateSinglePage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = await props.params;
  const { eventId } = params;

  return <ChangeDateSingleContent eventId={eventId} />;
}
