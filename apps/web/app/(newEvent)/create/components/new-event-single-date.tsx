'use client';
import { useFormContext } from './form-context';
import { Calendar } from '@/components/ui/calendar';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useCreateEvent } from '@/hooks/mutations/use-create-event';

const formSchema = z.object({
  date: z.date(),
  time: z.string().regex(new RegExp('^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')),
});

interface NewEventSingleDateProps {
  onBack: () => void;
}

export function NewEventSingleDate({ onBack }: NewEventSingleDateProps) {
  const { formState, reset } = useFormContext();
  const router = useRouter();
  const createEvent = useCreateEvent();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      time: new Date().toLocaleTimeString([], {
        timeStyle: 'short',
        hour12: false,
      }),
    },
  });

  // Use useWatch instead of form.watch() for React Compiler compatibility
  const watchedDate = useWatch({ control: form.control, name: 'date' });
  const watchedTime = useWatch({ control: form.control, name: 'time' });

  const onSubmit = useCallback(
    (data: z.infer<typeof formSchema>) => {
      const [hours, minutes] = data.time.split(':').map(Number);

      // Create new date object and set time components
      const dateTime = new Date(data.date);
      dateTime.setHours(hours, minutes, 0, 0);

      const { title, description, location } = formState;

      createEvent.mutate(
        {
          title,
          description,
          location,
          potentialDateTimes: [dateTime.toISOString()],
        },
        {
          onSuccess: result => {
            toast.success('The event was created successfully.');
            // Reset form context before navigation so it's fresh when user comes back
            reset();
            router.push(`/event/${result.event.id}`);
          },
          onError: () => {
            toast.error('The event was unable to be created.');
          },
        }
      );
    },
    [formState, createEvent, reset, router]
  );

  // In wizard mode, redirect is handled by parent
  // Keep validation check but don't redirect
  if (!formState.title) {
    return null;
  }

  const getDateTime = () => {
    const [hours, minutes] = watchedTime.split(':').map(Number);
    const dateTime = new Date(watchedDate);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime;
  };

  const getTimezoneString = () => {
    return `${Intl.DateTimeFormat().resolvedOptions().timeZone} (UTC${
      new Date().getTimezoneOffset() > 0 ? '-' : '+'
    }${Math.abs(new Date().getTimezoneOffset() / 60).toString()})`;
  };

  const isSaving = createEvent.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className='my-8 flex flex-col gap-4'>
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
                    onSelect={date =>
                      date ? form.setValue('date', date) : null
                    }
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='text-center'>
            <FormField
              control={form.control}
              name='time'
              render={({ field }) => (
                <FormItem>
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
            <span className='text-muted-foreground text-sm text-center'>
              {getTimezoneString()}
            </span>
          </div>
          <div className='mx-auto'>
            <div className='flex items-center rounded-lg bg-muted p-4 max-w-sm w-max mx-auto'>
              <h2 className='text-xl font-semibold'>
                {getDateTime().toLocaleString([], {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: true,
                })}
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
              className='flex items-center gap-1'
              type='submit'
              disabled={isSaving}
            >
              {isSaving ? (
                <Icons.spinner className='h-4 w-4 animate-spin' />
              ) : (
                <></>
              )}
              Submit
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
