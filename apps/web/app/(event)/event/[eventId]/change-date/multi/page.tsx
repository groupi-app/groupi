import { ChangeDateMultiContent } from './components/change-date-multi-content';
import { shouldRedirectToAvailability } from '@groupi/services/server';
import { redirect } from 'next/navigation';

export default async function EventChangeDateMultiPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = await props.params;
  const { eventId } = params;

  // Check if user should be redirected to availability page
  // Only redirects if there's an active poll (no chosen date) and user hasn't set availability
  const shouldRedirect = await shouldRedirectToAvailability(eventId);
  if (shouldRedirect === true) {
    redirect(`/event/${eventId}/availability`);
  }

  return <ChangeDateMultiContent eventId={eventId} />;
}
