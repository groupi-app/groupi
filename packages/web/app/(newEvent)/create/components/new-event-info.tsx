'use client';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Icons } from '@/components/icons';
import dynamic from 'next/dynamic';
import { useFormContext, type ReminderOffset } from './form-context';
import { Button } from '@/components/ui/button';

// Reminder offset options with display labels
const REMINDER_OPTIONS: Array<{
  value: ReminderOffset | 'never';
  label: string;
}> = [
  { value: 'never', label: 'Never' },
  { value: '30_MINUTES', label: '30 minutes before' },
  { value: '1_HOUR', label: '1 hour before' },
  { value: '2_HOURS', label: '2 hours before' },
  { value: '4_HOURS', label: '4 hours before' },
  { value: '1_DAY', label: '1 day before' },
  { value: '2_DAYS', label: '2 days before' },
  { value: '3_DAYS', label: '3 days before' },
  { value: '1_WEEK', label: '1 week before' },
  { value: '2_WEEKS', label: '2 weeks before' },
  { value: '4_WEEKS', label: '4 weeks before' },
];

const LocationInput = dynamic(
  () =>
    import('./location-input').then(mod => ({ default: mod.LocationInput })),
  {
    ssr: false,
    loading: () => (
      <Input
        data-test='new-event-location'
        placeholder="123 Main St... or 'My house'"
        disabled
      />
    ),
  }
);

const formSchema = z.object({
  title: z.string().min(1, {
    message: 'Event Title is required',
  }),
  description: z
    .string()
    .max(1000, { message: 'Description must be less than 1000 characters.' })
    .optional(),
  location: z
    .string()
    .max(200, { message: 'Location must be less than 200 characters.' })
    .optional(),
  reminderOffset: z
    .enum([
      'never',
      '30_MINUTES',
      '1_HOUR',
      '2_HOURS',
      '4_HOURS',
      '1_DAY',
      '2_DAYS',
      '3_DAYS',
      '1_WEEK',
      '2_WEEKS',
      '4_WEEKS',
    ])
    .optional(),
});

interface NewEventInfoProps {
  onNext: () => void;
}

export default function NewEventInfo({ onNext }: NewEventInfoProps) {
  const { formState, setFormState } = useFormContext();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: formState.title,
      description: formState.description,
      location: formState.location,
      reminderOffset: formState.reminderOffset ?? 'never',
    },
    mode: 'onChange',
  });

  // Sync form with context when context changes
  useEffect(() => {
    form.reset({
      title: formState.title || '',
      description: formState.description || '',
      location: formState.location || '',
      reminderOffset: formState.reminderOffset ?? 'never',
    });
  }, [
    formState.title,
    formState.description,
    formState.location,
    formState.reminderOffset,
    form,
  ]);

  function onSubmit(data: z.infer<typeof formSchema>) {
    // Convert "never" to undefined for the backend
    const reminderOffset =
      data.reminderOffset === 'never'
        ? undefined
        : (data.reminderOffset as ReminderOffset | undefined);
    setFormState({
      ...data,
      reminderOffset,
    });
    onNext();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className='gap-6 flex flex-col'>
          <FormField
            control={form.control}
            name='title'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Title
                  <span className='text-destructive align-text-top font-black'>
                    *
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    data-test='new-event-title'
                    placeholder='Groupi Party!'
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  The title of your event. (required)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    data-test='new-event-description'
                    placeholder='Join us for food and festivities...'
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  A brief description of your event.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='location'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <LocationInput dataTest='new-event-location' field={field} />
                </FormControl>
                <FormDescription>
                  The location where your event is taking place.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='reminderOffset'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remind attendees</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || 'never'}
                >
                  <FormControl>
                    <SelectTrigger data-test='new-event-reminder'>
                      <SelectValue placeholder='Select when to remind attendees' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {REMINDER_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Send a reminder to attendees before the event starts.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='flex justify-end'>
            <Button
              data-test='new-event-next-button'
              className='flex items-center gap-1'
              variant={'secondary'}
              type='submit'
            >
              <span>Next</span>
              <Icons.forward className='text-sm' />
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
