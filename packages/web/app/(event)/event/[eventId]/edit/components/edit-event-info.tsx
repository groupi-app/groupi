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
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useUpdateEvent } from '@/hooks/mutations/use-update-event';
import { Id } from '@/convex/_generated/dataModel';

// Reminder offset type
type ReminderOffset =
  | '30_MINUTES'
  | '1_HOUR'
  | '2_HOURS'
  | '4_HOURS'
  | '1_DAY'
  | '2_DAYS'
  | '3_DAYS'
  | '1_WEEK'
  | '2_WEEKS'
  | '4_WEEKS';

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

const formSchema = z.object({
  title: z
    .string()
    .min(1, { message: 'Title is required.' })
    .max(100, { message: 'Title must be less than 100 characters.' }),
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

export default function EditEventInfo({
  eventData,
}: {
  eventData: {
    eventId: Id<'events'>;
    title: string;
    description: string;
    location: string;
    reminderOffset?: ReminderOffset;
  };
}) {
  const { eventId, title, description, location, reminderOffset } = eventData;
  const router = useRouter();
  const updateEvent = useUpdateEvent();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: title,
      description: description,
      location: location,
      reminderOffset: reminderOffset ?? 'never',
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsSaving(true);
    // Show toast and redirect immediately (optimistic)
    toast.success('Event updated', {
      description: 'Event details have been updated.',
    });
    router.push(`/event/${eventId}`);

    // Convert "never" to null (which becomes undefined on backend)
    const reminderOffsetValue =
      data.reminderOffset === 'never'
        ? null
        : (data.reminderOffset as ReminderOffset | undefined);

    // Handle mutation in background
    try {
      await updateEvent({
        eventId: eventId,
        title: data.title,
        description: data.description,
        location: data.location,
        reminderOffset: reminderOffsetValue,
      });
    } catch {
      // Rollback navigation and show error toast
      router.push(`/event/${eventId}/edit`);
      toast.error('Error editing event', {
        description: 'Failed to edit event details.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Title</FormLabel>
              <FormControl>
                <Input placeholder='Enter event title' {...field} />
              </FormControl>
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
                  placeholder='Tell us a little bit about the event'
                  className='resize-none'
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide a brief description of your event.
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
                <Input placeholder='Enter event location' {...field} />
              </FormControl>
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
                  <SelectTrigger>
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
        <Button type='submit' isLoading={isSaving} loadingText='Saving...'>
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
