'use client';

import { useQuery } from 'convex/react';
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

export function InviteDetails({ inviteId }: { inviteId: string }) {
  const inviteData = useQuery(inviteQueries.getInviteByToken, {
    token: inviteId,
  });

  if (inviteData === undefined) {
    return (
      <div className='container mx-auto py-8 max-w-md'>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-center space-x-2'>
              <Icons.spinner className='h-4 w-4 animate-spin' />
              <span>Loading invite details...</span>
            </div>
          </CardContent>
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
          showBackButton={true}
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
