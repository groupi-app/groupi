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

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useUpdateEvent } from '@/hooks/mutations/use-update-event';
import { Id } from '@/convex/_generated/dataModel';

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
});

export default function EditEventInfo({
  eventData,
}: {
  eventData: {
    eventId: Id<"events">;
    title: string;
    description: string;
    location: string;
  };
}) {
  const { eventId, title, description, location } = eventData;
  const router = useRouter();
  const updateEvent = useUpdateEvent();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: title,
      description: description,
      location: location,
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsSaving(true);
    // Show toast and redirect immediately (optimistic)
    toast.success('Event updated', {
      description: 'Event details have been updated.',
    });
    router.push(`/event/${eventId}`);

    // Handle mutation in background
    try {
      await updateEvent({
        eventId: eventId,
        title: data.title,
        description: data.description,
        location: data.location,
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
        <Button type='submit' isLoading={isSaving} loadingText='Saving...'>Save Changes</Button>
      </form>
    </Form>
  );
}
