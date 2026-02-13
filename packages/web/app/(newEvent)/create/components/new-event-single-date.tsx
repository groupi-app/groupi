'use client';

import { useFormContext } from './form-context';
import { useCallback, useRef } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  SingleDateTimeSelector,
  type SingleDateTimeData,
} from '@/components/molecules/single-date-time-selector';

interface NewEventSingleDateProps {
  onBack: () => void;
  onNext: () => void;
}

export function NewEventSingleDate({
  onBack,
  onNext,
}: NewEventSingleDateProps) {
  const { formState, setFormState } = useFormContext();

  const dateTimeRef = useRef<SingleDateTimeData | null>(null);

  const handleDateTimeChange = useCallback((data: SingleDateTimeData) => {
    dateTimeRef.current = data;
  }, []);

  const handleNext = useCallback(() => {
    const dateTimeData = dateTimeRef.current;
    if (!dateTimeData || !dateTimeData.isValid) {
      if (
        dateTimeData?.startDateTime &&
        dateTimeData.startDateTime.getTime() <= Date.now()
      ) {
        toast.error('Event date and time must be in the future');
      } else {
        toast.error('Please select a valid date and time');
      }
      return;
    }

    setFormState({
      ...formState,
      dateType: 'single',
      singleDateTime: {
        startDateTime: dateTimeData.startDateTime.toISOString(),
        endDateTime: dateTimeData.endDateTime?.toISOString(),
      },
    });
    onNext();
  }, [formState, setFormState, onNext]);

  if (!formState.title) {
    return null;
  }

  return (
    <div className='my-8 flex flex-col gap-4'>
      <SingleDateTimeSelector onChange={handleDateTimeChange} />

      <div className='flex justify-between mt-2'>
        <Button
          type='button'
          className='flex items-center gap-1'
          variant='secondary'
          onClick={onBack}
        >
          <span>Back</span>
          <Icons.back className='text-sm' />
        </Button>
        <Button
          data-test='new-event-next-button'
          type='button'
          className='flex items-center gap-1'
          variant='secondary'
          onClick={handleNext}
        >
          <span>Next</span>
          <Icons.forward className='text-sm' />
        </Button>
      </div>
    </div>
  );
}
