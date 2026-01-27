'use client';
import { useFormContext } from './form-context';
import { Calendar } from '@/components/ui/calendar';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useCreateEvent } from '@/hooks/mutations/use-create-event';
import { useFileUpload } from '@/hooks/convex/use-file-upload';
import { formatDateTimeRangeShort } from '@/lib/utils';

// Helper to parse time string to hours and minutes
function parseTimeString(time: string): [number, number] {
  const [hours, minutes] = time.split(':').map(Number);
  return [hours, minutes];
}

// Helper to get start of day for date comparison
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Helper to add one hour to a time string
function addOneHour(time: string): string {
  const [hours, minutes] = parseTimeString(time);
  const newHours = (hours + 1) % 24;
  return `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

const formSchema = z
  .object({
    date: z.date(),
    time: z.string().regex(timeRegex),
    hasEndTime: z.boolean(),
    endDate: z.date().optional(),
    endTime: z.string().regex(timeRegex).optional(),
  })
  .refine(
    data => {
      if (!data.hasEndTime) return true;
      if (!data.endDate || !data.endTime) return false;

      const [startHours, startMinutes] = parseTimeString(data.time);
      const startDateTime = new Date(data.date);
      startDateTime.setHours(startHours, startMinutes, 0, 0);

      const [endHours, endMinutes] = parseTimeString(data.endTime);
      const endDateTime = new Date(data.endDate);
      endDateTime.setHours(endHours, endMinutes, 0, 0);

      return endDateTime > startDateTime;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

interface NewEventSingleDateProps {
  onBack: () => void;
}

export function NewEventSingleDate({ onBack }: NewEventSingleDateProps) {
  const { formState, reset } = useFormContext();
  const router = useRouter();
  const createEvent = useCreateEvent();
  const { uploadFile } = useFileUpload();
  const [isSaving, setIsSaving] = useState(false);

  const currentTime = new Date().toLocaleTimeString([], {
    timeStyle: 'short',
    hour12: false,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      time: currentTime,
      hasEndTime: false,
      endDate: new Date(),
      endTime: addOneHour(currentTime),
    },
  });

  // Use useWatch instead of form.watch() for React Compiler compatibility
  const watchedDate = useWatch({ control: form.control, name: 'date' });
  const watchedTime = useWatch({ control: form.control, name: 'time' });
  const watchedHasEndTime = useWatch({
    control: form.control,
    name: 'hasEndTime',
  });
  const watchedEndDate = useWatch({ control: form.control, name: 'endDate' });
  const watchedEndTime = useWatch({ control: form.control, name: 'endTime' });

  // When hasEndTime is enabled, set default end values
  useEffect(() => {
    if (watchedHasEndTime) {
      const currentEndDate = form.getValues('endDate');
      const currentEndTime = form.getValues('endTime');
      // If no end date/time set, default to same date + 1 hour
      if (!currentEndDate) {
        form.setValue('endDate', watchedDate);
      }
      if (!currentEndTime) {
        form.setValue('endTime', addOneHour(watchedTime || currentTime));
      }
    }
  }, [watchedHasEndTime, watchedDate, watchedTime, form, currentTime]);

  const onSubmit = useCallback(
    async (data: z.infer<typeof formSchema>) => {
      const [hours, minutes] = parseTimeString(data.time);

      // Create new date object and set time components
      const dateTime = new Date(data.date);
      dateTime.setHours(hours, minutes, 0, 0);

      // Handle end time if enabled
      let endDateTime: Date | undefined;
      if (data.hasEndTime && data.endDate && data.endTime) {
        const [endHours, endMinutes] = parseTimeString(data.endTime);
        endDateTime = new Date(data.endDate);
        endDateTime.setHours(endHours, endMinutes, 0, 0);
      }

      const { title, description, location, reminderOffset, imageFile } =
        formState;

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
          chosenDateTime: dateTime.toISOString(),
          chosenEndDateTime: endDateTime?.toISOString(),
          reminderOffset,
          imageStorageId,
        });
        toast.success('The event was created successfully.');
        router.push(`/event/${result.eventId}`);
        // Reset form context after navigation starts so user doesn't see flash
        // The setTimeout ensures the router navigation begins before the reset
        setTimeout(() => reset(), 100);
      } catch {
        toast.error('The event was unable to be created.');
      } finally {
        setIsSaving(false);
      }
    },
    [formState, createEvent, uploadFile, reset, router]
  );

  // In wizard mode, redirect is handled by parent
  // Keep validation check but don't redirect
  if (!formState.title) {
    return null;
  }

  const getDateTime = () => {
    if (!watchedTime) return new Date();
    const [hours, minutes] = watchedTime.split(':').map(Number);
    const dateTime = new Date(watchedDate || new Date());
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime;
  };

  const getEndDateTime = () => {
    if (!watchedEndTime || !watchedEndDate) return null;
    const [hours, minutes] = watchedEndTime.split(':').map(Number);
    const dateTime = new Date(watchedEndDate);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime;
  };

  const getTimezoneString = () => {
    return `${Intl.DateTimeFormat().resolvedOptions().timeZone} (UTC${
      new Date().getTimezoneOffset() > 0 ? '-' : '+'
    }${Math.abs(new Date().getTimezoneOffset() / 60).toString()})`;
  };

  const getDisplayDateTime = () => {
    const start = getDateTime();
    const end = watchedHasEndTime ? getEndDateTime() : null;
    return formatDateTimeRangeShort(start, end);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className='my-8 flex flex-col gap-4'>
          {/* Start Date/Time Section */}
          <div className='flex flex-col md:flex-row gap-4 justify-center'>
            <div className='flex flex-col gap-2'>
              <FormLabel className='text-center'>Start</FormLabel>
              <FormField
                control={form.control}
                name='date'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Calendar
                        mode='single'
                        className='rounded-md border border-border w-max mx-auto'
                        selected={field.value}
                        onSelect={date => {
                          if (date) {
                            form.setValue('date', date);
                            // If end date hasn't been changed, keep it in sync
                            if (watchedEndDate && watchedEndDate <= date) {
                              form.setValue('endDate', date);
                            }
                          }
                        }}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='time'
                render={({ field }) => (
                  <FormItem className='text-center'>
                    <FormControl>
                      <Input
                        data-test='new-event-single-time'
                        type='time'
                        className='w-max mx-auto cursor-text'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* End Date/Time Section - only shown when hasEndTime is true */}
            {watchedHasEndTime && (
              <div className='flex flex-col gap-2'>
                <FormLabel className='text-center'>End</FormLabel>
                <FormField
                  control={form.control}
                  name='endDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Calendar
                          mode='single'
                          className='rounded-md border border-border w-max mx-auto'
                          selected={field.value}
                          onSelect={date =>
                            date && form.setValue('endDate', date)
                          }
                          disabled={date =>
                            startOfDay(date) <
                            startOfDay(watchedDate || new Date())
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='endTime'
                  render={({ field }) => (
                    <FormItem className='text-center'>
                      <FormControl>
                        <Input
                          type='time'
                          className='w-max mx-auto cursor-text'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          {/* Add End Time Toggle */}
          <div className='flex items-center justify-center gap-2'>
            <FormField
              control={form.control}
              name='hasEndTime'
              render={({ field }) => (
                <FormItem className='flex items-center gap-2'>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className='!mt-0 cursor-pointer'>
                    Add end time
                  </FormLabel>
                </FormItem>
              )}
            />
          </div>

          <span className='text-muted-foreground text-sm text-center'>
            {getTimezoneString()}
          </span>

          {/* Preview */}
          <div className='mx-auto'>
            <div className='flex items-center rounded-lg bg-muted p-4 max-w-md w-max mx-auto'>
              <h2 className='text-lg font-semibold text-center'>
                {getDisplayDateTime()}
              </h2>
            </div>
          </div>

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
              data-test='new-event-single-submit'
              type='submit'
              isLoading={isSaving}
            >
              Submit
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
