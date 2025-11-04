import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Icons } from '@/components/icons';

// Type for the event data that this component expects
// Simplified to match what we actually have from UserDashboardData.memberships[].event
type EventCardData = {
  id: string;
  title: string;
  description: string;
  location: string;
  chosenDateTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function EventCard({ event }: { event: EventCardData }) {
  const {
    id,
    title,
    description,
    location,
    chosenDateTime,
    createdAt,
    updatedAt,
  } = event;
  return (
    <Link href={`/event/${id}`}>
      <div className='flex flex-col gap-2 border border-border shadow-md p-4 px-6 hover:bg-accent transition-all cursor-pointer rounded-md'>
        <div className='flex flex-col md:flex-row gap-2 md:gap-8'>
          <div className='flex flex-col grow gap-2 md:w-1/2'>
            <h1 className='font-heading text-2xl'>{title}</h1>
            <p className='text-muted-foreground'>{description}</p>
            {/* Owner info removed - not available in current data structure */}
          </div>
          <div className='flex flex-col md:w-1/2 justify-between gap-2'>
            <div className='flex flex-col gap-2'>
              {location && (
                <div className='flex items-center gap-1 '>
                  <Icons.location className='size-6 text-primary' />
                  <span>{location}</span>
                </div>
              )}
              <div className='flex items-center gap-1 '>
                <Icons.date className='size-6 text-primary' />
                {chosenDateTime != null ? (
                  <span>
                    {new Date(chosenDateTime).toLocaleString([], {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                    })}
                  </span>
                ) : (
                  <span>TBD</span>
                )}
              </div>
              {/* Member count removed - not available in current data structure */}
            </div>
            <div className='flex flex-col'>
              {/* Created at */}
              <div className='flex items-center gap-1 '>
                <span className='text-muted-foreground'>
                  Created {formatDate(new Date(createdAt))}
                </span>
              </div>
              {/* Last activity at*/}
              <div className='flex items-center gap-1 '>
                <span className='text-muted-foreground'>
                  Last activity {formatDate(new Date(updatedAt))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
