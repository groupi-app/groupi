'use client';

import { useChooseDateTime } from '@/hooks/mutations/use-choose-date-time';
import { Id } from '@/convex/_generated/dataModel';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState, useRef } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  SingleDateTimeSelector,
  type SingleDateTimeData,
} from '@/components/molecules/single-date-time-selector';
import { formatTimeForInput } from '@/lib/datetime-helpers';

interface EditEventSingleDateProps {
  eventId: string;
  datetime: Date | undefined;
  endDatetime?: Date | undefined;
}

export function EditEventSingleDate({
  eventId,
  datetime,
  endDatetime,
}: EditEventSingleDateProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const chooseDateTime = useChooseDateTime();

  // Store the current datetime values from the selector
  const dateTimeRef = useRef<SingleDateTimeData | null>(null);

  const handleDateTimeChange = useCallback((data: SingleDateTimeData) => {
    dateTimeRef.current = data;
  }, []);

  const onSubmit = useCallback(async () => {
    const dateTimeData = dateTimeRef.current;
    if (!dateTimeData || !dateTimeData.isValid) {
      toast.error('Please select a valid date and time');
      return;
    }

    setIsUpdating(true);

    try {
      await chooseDateTime(
        eventId as Id<'events'>,
        dateTimeData.startDateTime,
        dateTimeData.endDateTime
      );
      router.push(`/event/${eventId}`);
    } catch {
      toast.error('Failed to update date/time', {
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsUpdating(false);
    }
  }, [eventId, chooseDateTime, router]);

  // Prepare initial values for the selector
  const initialStartDate = datetime ?? new Date();
  const initialStartTime = datetime ? formatTimeForInput(datetime) : undefined;
  const initialHasEndTime = !!endDatetime;
  const initialEndDate = endDatetime ?? undefined;
  const initialEndTime = endDatetime
    ? formatTimeForInput(endDatetime)
    : undefined;

  return (
    <div className='my-8 flex flex-col gap-4'>
      <SingleDateTimeSelector
        initialStartDate={initialStartDate}
        initialStartTime={initialStartTime}
        initialHasEndTime={initialHasEndTime}
        initialEndDate={initialEndDate}
        initialEndTime={initialEndTime}
        onChange={handleDateTimeChange}
      />

      <div className='flex justify-between mt-2'>
        <Link href={`/event/${eventId}/change-date`}>
          <Button className='flex items-center gap-1' variant={'secondary'}>
            <span>Back</span>
            <Icons.back className='text-sm' />
          </Button>
        </Link>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              data-test='new-event-single-submit'
              className='flex items-center gap-1'
              type='button'
            >
              Submit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Date/Time</DialogTitle>
              <DialogDescription>
                Are you sure you want to update the date/time? This will
                override any existing polls.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant='ghost'>Cancel</Button>
              </DialogClose>
              <Button type='button' onClick={onSubmit} isLoading={isUpdating}>
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
