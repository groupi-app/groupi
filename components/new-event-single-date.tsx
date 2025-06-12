'use client';
import { useFormContext } from '@/components/providers/form-context-provider';
import { Calendar } from '@/components/ui/calendar';
import { createEvent } from '@/lib/actions/event';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Icons } from './icons';
import { Button } from './ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { toast } from 'sonner';

const formSchema = z.object({
  date: z.date(),
  time: z.string().regex(new RegExp('^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')),
});

export function NewEventSingleDate() {
  const { formState } = useFormContext();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState<boolean>(false);

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

  if (!formState.title) {
    router.push('/create');
    return null;
  }

  const getDateTime = () => {
    const date = form.watch('date');
    const time = form.watch('time');

    // Split time into hours and minutes
    const [hours, minutes] = time.split(':').map(Number);

    // Create new date object and set time components
    const dateTime = new Date(date);
    dateTime.setHours(hours, minutes, 0, 0);

    return dateTime;
  };

  const getTimezoneString = () => {
    return `${Intl.DateTimeFormat().resolvedOptions().timeZone} (UTC${
      new Date().getTimezoneOffset() > 0 ? '-' : '+'
    }${Math.abs(new Date().getTimezoneOffset() / 60).toString()})`;
  };

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsSaving(true);
    const [hours, minutes] = data.time.split(':').map(Number);

    // Create new date object and set time components
    const dateTime = new Date(data.date);
    dateTime.setHours(hours, minutes, 0, 0);

    const { title, description, location } = formState;

    const res = await createEvent({
      title,
      description,
      location,
      dateTime: dateTime.toISOString(),
    });
    if (res.error) {
      toast.error('The event was unable to be created.');
      setIsSaving(false);
    }
    if (res.success) {
      toast.success('The event was created successfully.');
      router.push(`/event/${res.success.id}`);
    }
  }

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
            <Link href='/create/date-type'>
              <Button className='flex items-center gap-1' variant={'secondary'}>
                <span>Back</span>
                <Icons.back className='text-sm' />
              </Button>
            </Link>
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
