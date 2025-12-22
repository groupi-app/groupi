import { DateSelectContent } from './components/date-select-content';
import {
  shouldRedirectToAvailability,
  getCachedEventHeaderData,
} from '@groupi/services/server';
import { redirect } from 'next/navigation';

export default async function EventDateSelectPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = await props.params;
  const { eventId } = params;

  // If event already has a chosen date, redirect to event page
  const [headerError, headerData] = await getCachedEventHeaderData(eventId);
  const hasChosenDate = !headerError && headerData?.event?.chosenDateTime;

  if (hasChosenDate) {
    redirect(`/event/${eventId}`);
  }

  // Check if user should be redirected to availability page
  // Only redirects if there's an active poll (no chosen date) and user hasn't set availability
  const shouldRedirect = await shouldRedirectToAvailability(eventId);
  if (shouldRedirect === true) {
    redirect(`/event/${eventId}/availability`);
  }

  return <DateSelectContent eventId={eventId} />;
}
