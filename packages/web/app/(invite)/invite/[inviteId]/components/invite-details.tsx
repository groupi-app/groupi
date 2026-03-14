'use client';

import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';

// Dynamic require to avoid deep type instantiation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let inviteQueries: any;
function initApi() {
  if (!inviteQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    inviteQueries = api.invites?.queries ?? {};
  }
}
initApi();
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AcceptInviteForm } from './invite-accept';
import { formatDateTimeRange } from '@/lib/utils';
import { ExpiredError } from '@/components/error-display';
import { Skeleton } from '@/components/ui/skeleton';

export function InviteDetails({ inviteId }: { inviteId: string }) {
  const router = useRouter();
  const inviteData = useQuery(inviteQueries.getInviteByToken, {
    token: inviteId,
  });

  // Redirect to event page if user is already a member
  useEffect(() => {
    if (inviteData?.isAlreadyMember && inviteData?.event?.id) {
      router.replace(`/event/${inviteData.event.id}`);
    }
  }, [inviteData?.isAlreadyMember, inviteData?.event?.id, router]);

  // Show loading state while redirecting or loading data
  if (inviteData === undefined || inviteData?.isAlreadyMember) {
    return (
      <div className='container mx-auto py-8 max-w-md'>
        <Card>
          <CardHeader className='text-center'>
            <CardTitle>You&apos;re Invited!</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Event title and description */}
            <div>
              <Skeleton className='h-7 w-3/4 mb-2' />
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-2/3 mt-1' />
            </div>

            {/* Location */}
            <div className='flex items-center gap-2 text-sm'>
              <Icons.mapPin className='h-4 w-4 text-muted-foreground' />
              <Skeleton className='h-4 w-32' />
            </div>

            {/* Date/time */}
            <div className='flex items-center gap-2 text-sm'>
              <Icons.calendar className='h-4 w-4 text-muted-foreground' />
              <Skeleton className='h-4 w-48' />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className='h-10 w-full rounded-button' />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className='container mx-auto py-8 max-w-md'>
        <ExpiredError
          title='Invalid Invite'
          message='This invite link is invalid, expired, or has been used up. Please ask the event organizer for a new invite.'
          showBackButton={false}
          showHomeButton={true}
        />
      </div>
    );
  }

  const { event } = inviteData;

  return (
    <div className='container mx-auto py-8 max-w-md'>
      <Card>
        <CardHeader className='text-center'>
          <CardTitle>You&apos;re Invited!</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <h3 className='font-semibold text-lg'>{event.title}</h3>
            {event.description && (
              <p className='text-muted-foreground mt-1'>{event.description}</p>
            )}
          </div>

          {event.location && (
            <div className='flex items-center gap-2 text-sm'>
              <Icons.mapPin className='h-4 w-4' />
              <span>{event.location}</span>
            </div>
          )}

          {event.chosenDateTime && (
            <div className='flex items-center gap-2 text-sm'>
              <Icons.calendar className='h-4 w-4' />
              <span>
                {formatDateTimeRange(
                  event.chosenDateTime,
                  event.chosenEndDateTime
                )}
              </span>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <AcceptInviteForm inviteId={inviteId} eventId={event.id} />
        </CardFooter>
      </Card>
    </div>
  );
}
