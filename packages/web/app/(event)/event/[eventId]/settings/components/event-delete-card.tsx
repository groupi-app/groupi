'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { DeleteEventDialog } from '../../components/deleteEventDialog';
import { useEventData } from '../../context';

export function EventDeleteCard() {
  const { headerData } = useEventData();
  if (headerData?.userMembership?.role !== 'ORGANIZER') return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Delete event</CardTitle>
        <CardDescription>
          Permanently delete this event and all of its data. This action cannot
          be undone.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant='destructive'>Delete Event</Button>
          </DialogTrigger>
          <DeleteEventDialog eventId={headerData.event._id} />
        </Dialog>
      </CardFooter>
    </Card>
  );
}
