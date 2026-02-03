'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useRef } from 'react';
import {
  useResetEventDate,
  useUpdatePotentialDateTimes,
} from '@/hooks/convex/use-events';
import { Id } from '@/convex/_generated/dataModel';
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
  MultiDateTimeSelector,
  type DateTimeOption,
} from '@/components/molecules/multi-date-time-selector';
import { generateId } from '@/lib/datetime-helpers';

interface EditEventMultiDateProps {
  eventId: Id<'events'>;
  /** Initial options from existing potential date times */
  initialOptions?: Array<{ start: Date; end?: Date }>;
}

export function EditEventMultiDate({
  eventId,
  initialOptions,
}: EditEventMultiDateProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const resetEventDate = useResetEventDate();
  const updatePotentialDateTimes = useUpdatePotentialDateTimes();

  // Store the current options from the selector
  const optionsRef = useRef<DateTimeOption[]>([]);
  const [optionsCount, setOptionsCount] = useState(0);

  const handleOptionsChange = useCallback((options: DateTimeOption[]) => {
    optionsRef.current = options;
    setOptionsCount(options.length);
  }, []);

  const onSubmit = useCallback(async () => {
    const options = optionsRef.current;
    if (options.length < 2) {
      toast.error('Please add at least two date options');
      return;
    }

    setIsUpdating(true);
    setDialogOpen(false); // Close dialog immediately

    // Convert options to the format expected by the mutation
    const potentialDateTimes = options.map(opt => opt.start.getTime());

    try {
      // Update potential date times
      await updatePotentialDateTimes({
        eventId,
        potentialDateTimes,
      });

      // Reset chosen date
      await resetEventDate({
        eventId,
      });

      toast.success('New poll started successfully.');
      router.push(`/event/${eventId}`);
    } catch {
      toast.error('Failed to start new poll', {
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsUpdating(false);
    }
  }, [eventId, updatePotentialDateTimes, resetEventDate, router]);

  // Convert initial options to DateTimeOption format
  const initialDateTimeOptions: DateTimeOption[] | undefined =
    initialOptions?.map(opt => ({
      id: generateId(),
      start: opt.start,
      end: opt.end,
    }));

  return (
    <div className='my-8 flex flex-col gap-6'>
      <MultiDateTimeSelector
        initialOptions={initialDateTimeOptions}
        onChange={handleOptionsChange}
        minOptions={2}
        showSmartInput={true}
      />

      <div className='flex justify-between'>
        <Link href={`/event/${eventId}/change-date`}>
          <Button className='flex items-center gap-1' variant={'secondary'}>
            <span>Back</span>
            <Icons.back className='text-sm' />
          </Button>
        </Link>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              disabled={optionsCount < 2}
              data-test='new-event-single-submit'
              className='flex items-center gap-1'
              type='button'
            >
              Submit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Run New Date/Time Poll?</DialogTitle>
              <DialogDescription>
                Are you sure you want to start a new date/time poll? This will
                override any existing polls.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant='ghost'>Cancel</Button>
              </DialogClose>
              <Button
                type='button'
                onClick={onSubmit}
                disabled={optionsCount < 2}
                isLoading={isUpdating}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
