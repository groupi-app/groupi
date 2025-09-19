import { formatDate, getFullName, getInitials } from '@/lib/utils';
import { EventWithMembers } from '@groupi/schema';
import Link from 'next/link';
import ErrorPage from '@/components/error';
import { Icons } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function EventCard({ event }: { event: EventWithMembers }) {
  const {
    id,
    title,
    description,
    location,
    chosenDateTime,
    createdAt,
    updatedAt,
    memberships,
  } = event;
  const owner = memberships.find(m => m.role === 'ORGANIZER')?.person;
  if (!owner) {
    return <ErrorPage message={'Unable to load event.'} />;
  }
  return (
    <Link href={`/event/${id}`}>
      <div className='flex flex-col gap-2 border border-border shadow-md p-4 px-6 hover:bg-accent transition-all cursor-pointer rounded-md'>
        <div className='flex flex-col md:flex-row gap-2 md:gap-8'>
          <div className='flex flex-col grow gap-2 md:w-1/2'>
            <h1 className='font-heading text-2xl'>{title}</h1>
            <p className='text-muted-foreground'>{description}</p>
            <div className='flex items-center gap-1'>
              <Avatar className='size-8'>
                <AvatarImage src={owner.imageUrl} />
                <AvatarFallback>
                  {getInitials(owner.firstName, owner.lastName)}
                </AvatarFallback>
              </Avatar>
              <span className='text-muted-foreground'>
                {getFullName(owner.firstName, owner.lastName) !== ''
                  ? getFullName(owner.firstName, owner.lastName)
                  : owner.username}
              </span>
            </div>
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
              <div className='flex items-center gap-1 '>
                <Icons.people className='size-6 text-primary' />
                <span>{memberships.length}</span>
              </div>
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
