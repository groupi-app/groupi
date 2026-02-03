'use client';

import { useFormContext } from './form-context';
import { useRouter } from 'next/navigation';
import { useCallback, useState, useRef } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCreateEvent } from '@/hooks/mutations/use-create-event';
import { useFileUpload } from '@/hooks/convex/use-file-upload';
import {
  SingleDateTimeSelector,
  type SingleDateTimeData,
} from '@/components/molecules/single-date-time-selector';

interface NewEventSingleDateProps {
  onBack: () => void;
}

export function NewEventSingleDate({ onBack }: NewEventSingleDateProps) {
  const { formState, reset } = useFormContext();
  const router = useRouter();
  const createEvent = useCreateEvent();
  const { uploadFile } = useFileUpload();
  const [isSaving, setIsSaving] = useState(false);

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

    const {
      title,
      description,
      location,
      reminderOffset,
      imageFile,
      imageFocalPoint,
    } = formState;

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
        chosenDateTime: dateTimeData.startDateTime.toISOString(),
        chosenEndDateTime: dateTimeData.endDateTime?.toISOString(),
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
      setIsSaving(false);
    }
  }, [formState, createEvent, uploadFile, reset, router]);

  // In wizard mode, redirect is handled by parent
  // Keep validation check but don't redirect
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
          variant={'secondary'}
          onClick={onBack}
        >
          <span>Back</span>
          <Icons.back className='text-sm' />
        </Button>
        <Button
          data-test='create-event-button'
          type='button'
          onClick={onSubmit}
          isLoading={isSaving}
        >
          Create Event
        </Button>
      </div>
    </div>
  );
}
