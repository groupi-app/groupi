'use client';

import { useFormContext } from './form-context';
import { useRouter } from 'next/navigation';
import { useRef, useState, useCallback } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCreateEvent } from '@/hooks/mutations/use-create-event';
import { useFileUpload } from '@/hooks/convex/use-file-upload';
import {
  MultiDateTimeSelector,
  type DateTimeOption,
} from '@/components/molecules/multi-date-time-selector';

interface NewEventMultiDateProps {
  onBack: () => void;
}

export function NewEventMultiDate({ onBack }: NewEventMultiDateProps) {
  const { formState, reset } = useFormContext();
  const router = useRouter();
  const createEvent = useCreateEvent();
  const { uploadFile } = useFileUpload();
  const isSubmittingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

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

    const {
      title,
      description,
      location,
      reminderOffset,
      imageFile,
      imageFocalPoint,
    } = formState;

    isSubmittingRef.current = true;
    setIsSaving(true);
    try {
      // Upload image file if present
      let imageStorageId: string | undefined;
      if (imageFile) {
        const uploadResult = await uploadFile(imageFile);
        if (!uploadResult) {
          toast.error('Failed to upload image.');
          return;
        }
        imageStorageId = uploadResult.storageId;
      }

      const result = await createEvent({
        title,
        description,
        location,
        potentialDateTimeOptions: options.map(opt => ({
          start: opt.start.toISOString(),
          end: opt.end?.toISOString(),
        })),
        reminderOffset,
        imageStorageId,
        imageFocalPoint,
      });
      toast.success('The event was created successfully.');
      router.push(`/event/${result.eventId}`);
      // Reset form context after navigation starts so user doesn't see flash
      setTimeout(() => reset(), 100);
    } catch {
      toast.error('The event was unable to be created.');
    } finally {
      isSubmittingRef.current = false;
      setIsSaving(false);
    }
  }, [formState, createEvent, uploadFile, reset, router]);

  // In wizard mode, redirect is handled by parent
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
          data-test='create-event-button'
          type='button'
          onClick={onSubmit}
          disabled={optionsCount < 2}
          isLoading={isSaving}
        >
          Create Event
        </Button>
      </div>
    </div>
  );
}
