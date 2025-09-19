'use client';
import { useEventAttendees } from '@groupi/hooks';
import { Icons } from '@/components/icons';

export function AttendeeCount({ eventId }: { eventId: string }) {
  const { data, isLoading } = useEventAttendees(eventId);

  if (isLoading || !data) {
    return null;
  }

  const [error, attendeesData] = data;

  if (error) {
    return null; // Silently fail for this component as it's just a count
  }

  const { event } = attendeesData;
  const { memberships, chosenDateTime } = event;

  if (chosenDateTime === null) {
    return null;
  }

  return (
    <div className='flex flex-col sm:flex-row sm:items-center sm:divide-x border border-border rounded-md p-2 w-max sm:w-full max-w-md flex-wrap justify-between '>
      <div className='flex items-center gap-1 px-3'>
        <Icons.check className='text-green-500' />
        <span className='text-muted-foreground'>Yes:</span>
        <span>
          {
            memberships.filter(membership => membership.rsvpStatus === 'YES')
              .length
          }
        </span>
      </div>
      <div className='flex items-center gap-1 px-3'>
        <span className='font-semibold w-6 text-xl text-yellow-500 text-center'>
          ?
        </span>
        <span className='text-muted-foreground'>Maybe:</span>
        <span>
          {
            memberships.filter(membership => membership.rsvpStatus === 'MAYBE')
              .length
          }
        </span>
      </div>
      <div className='flex items-center gap-1 px-3'>
        <Icons.close className='text-red-500' />
        <span className='text-muted-foreground'>No:</span>
        <span>
          {
            memberships.filter(membership => membership.rsvpStatus === 'NO')
              .length
          }
        </span>
      </div>
      <div className='flex items-center gap-1 px-3'>
        <span className='text-muted-foreground'>Pending:</span>
        <span>
          {
            memberships.filter(
              membership => membership.rsvpStatus === 'PENDING'
            ).length
          }
        </span>
      </div>
    </div>
  );
}
