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
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

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

/**
 * Blank form version shown during Suspense fallback
 * Renders the form structure immediately so it feels instant
 * while auth check happens in the background
 */
export function NewEventFormBlank() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
    },
  });

  return (
    <Form {...form}>
      <form>
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
                    disabled
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
                    disabled
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
                  <Input
                    data-test='new-event-location'
                    placeholder="123 Main St... or 'My house'"
                    disabled
                    {...field}
                  />
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
              data-test='new-event-next-button'
              className='flex items-center gap-1'
              variant={'secondary'}
              disabled
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

