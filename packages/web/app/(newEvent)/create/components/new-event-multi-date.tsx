'use client';

import { useFormContext } from './form-context';
import { useRef, useState, useCallback } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  MultiDateTimeSelector,
  type DateTimeOption,
} from '@/components/molecules/multi-date-time-selector';

interface NewEventMultiDateProps {
  onBack: () => void;
  onNext: () => void;
}

export function NewEventMultiDate({ onBack, onNext }: NewEventMultiDateProps) {
  const { formState, setFormState } = useFormContext();

  const optionsRef = useRef<DateTimeOption[]>([]);
  const [optionsCount, setOptionsCount] = useState(0);

  const handleOptionsChange = useCallback((options: DateTimeOption[]) => {
    optionsRef.current = options;
    setOptionsCount(options.length);
  }, []);

  const handleNext = useCallback(() => {
    const options = optionsRef.current;
    if (options.length < 2) {
      toast.error('Please add at least two date options');
      return;
    }

    const now = Date.now();
    const pastOptions = options.filter(opt => opt.start.getTime() <= now);
    if (pastOptions.length > 0) {
      toast.error('All date options must be in the future');
      return;
    }

    setFormState({
      ...formState,
      dateType: 'multi',
      multiDateTimeOptions: options.map(opt => ({
        start: opt.start.toISOString(),
        end: opt.end?.toISOString(),
      })),
    });
    onNext();
  }, [formState, setFormState, onNext]);

  if (!formState.title) {
    return null;
  }

  return (
    <div className='my-8 flex flex-col gap-6'>
      <MultiDateTimeSelector
        onChange={handleOptionsChange}
        minOptions={2}
        showSmartInput={true}
      />

      <div className='flex justify-between'>
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
          disabled={optionsCount < 2}
          onClick={handleNext}
        >
          <span>Next</span>
          <Icons.forward className='text-sm' />
        </Button>
      </div>
    </div>
  );
}
