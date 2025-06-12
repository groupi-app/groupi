import { EditEventMultiDate } from '@/components/edit-event-multi-date';
import ErrorPage from '@/components/error';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';

export default async function Page(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = await props.params;
  const { eventId } = params;

  const { userId }: { userId: string | null } = await auth();

  const event = await db.event.findUnique({
    where: { id: eventId },
    include: {
      memberships: true,
      potentialDateTimes: true,
    },
  });

  if (!event) {
    notFound();
  }

  const userMembership = event.memberships.find(
    membership => membership.personId === userId
  );

  if (!userMembership) {
    return <ErrorPage message={'You are not a member of this event.'} />;
  }

  if (userMembership.role !== 'ORGANIZER') {
    return (
      <ErrorPage
        message={'You do not have permission to change the date of this event.'}
      />
    );
  }

  const dates = event.potentialDateTimes
    ? event.potentialDateTimes.map(pdt => pdt.dateTime)
    : undefined;
  return (
    <div className='container max-w-4xl'>
      <h1 className='text-4xl font-heading mt-10'>Event Date/Time Options</h1>
      <EditEventMultiDate eventId={eventId} dates={dates} />
    </div>
  );
}
