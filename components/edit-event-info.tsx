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

import { updateEventDetails } from '@/lib/actions/event';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Icons } from './icons';
import { LocationInput } from './location-input';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';

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
});

export default function EditEventInfo({
  eventData,
}: {
  eventData: {
    eventId: string;
    title: string;
    description: string;
    location: string;
  };
}) {
  const { eventId, title, description, location } = eventData;
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { toast } = useToast();
  const router = useRouter();

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
    const res = await updateEventDetails({
      id: eventId,
      title: data.title,
      description: data.description,
      location: data.location,
    });
    if (res.error) {
      toast({
        title: 'Error editing event',
        description: 'Failed to edit event details.',
        variant: 'destructive',
      });
    }
    if (res.success) {
      toast({
        title: 'Event updated',
        description: 'Event details have been updated.',
      });
      router.push(`/event/${eventId}`);
    }
    setIsSaving(false);
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
                  Title<span className='text-muted-foreground'>*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder='Groupi Party!' {...field} />
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
                  <LocationInput dataTest='edit-event-location' field={field} />
                </FormControl>
                <FormDescription>
                  The location where your event is taking place.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='flex justify-end'>
            <Button
              className='w-full md:w-max flex items-center gap-1'
              type='submit'
              disabled={isSaving}
            >
              {isSaving ? (
                <Icons.spinner className='h-4 w-4 animate-spin' />
              ) : (
                <Icons.save className='size-4' />
              )}
              <span>Save</span>
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
