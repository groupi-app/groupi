'use client';
import { useFormContext } from '@/components/providers/form-context-provider';
import { Calendar } from '@/components/ui/calendar';
import { createEventAction } from '@/actions/event-actions';
import { merge } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface Form1Types {
  dates: Date[];
  time: string;
}

interface Form2Types {
  dateTimes: Date[];
}

const form1Schema = z.object({
  dates: z
    .array(z.date())
    .min(1, { message: 'At least one date is required.' }),
  time: z.string().regex(new RegExp('^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')),
});

const form2Schema = z.object({
  dateTimes: z
    .array(z.date())
    .min(2, { message: 'At least two dates are required.' }),
});

export function NewEventMultiDate() {
  const { formState } = useFormContext();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const form1 = useForm<Form1Types>({
    resolver: zodResolver(form1Schema),
    defaultValues: {
      dates: [new Date()],
      time: new Date().toLocaleTimeString([], {
        timeStyle: 'short',
        hour12: false,
      }),
    },
  });

  const form2 = useForm<Form2Types>({
    resolver: zodResolver(form2Schema),
    defaultValues: {
      dateTimes: [],
    },
  });

  // Use useWatch instead of form.watch() for React Compiler compatibility
  const watchedDates =
    useWatch({ control: form1.control, name: 'dates' }) || [];
  const watchedDateTimes =
    useWatch({ control: form2.control, name: 'dateTimes' }) || [];

  // Move redirect to useEffect to avoid calling during render
  useEffect(() => {
    if (!formState.title) {
      router.push('/create');
    }
  }, [formState.title, router]);

  if (!formState.title) {
    return null;
  }

  const getTimezoneString = () => {
    return `${Intl.DateTimeFormat().resolvedOptions().timeZone} (UTC${
      new Date().getTimezoneOffset() > 0 ? '-' : '+'
    }${Math.abs(new Date().getTimezoneOffset() / 60).toString()})`;
  };

  async function onSubmit1(data: z.infer<typeof form1Schema>) {
    const dates = data.dates;
    const localTime = data.time + ':00';

    const dateTimes = dates.map(
      date => new Date(`${date.toISOString().split('T')[0]}T${localTime}`)
    );

    form2.setValue(
      'dateTimes',
      merge(
        form2.getValues('dateTimes'),
        dateTimes,
        (a, b) => a.getTime() === b.getTime()
      )
    );
  }

  async function onSubmit2(data: z.infer<typeof form2Schema>) {
    setIsSaving(true);

    const { title, description, location } = formState;

    const [error, result] = await createEventAction({
      title,
      description,
      location,
      potentialDateTimes: data.dateTimes.map(date => date.toISOString()),
    });

    if (error) {
      toast.error('The event was unable to be created.');
      setIsSaving(false);
    } else if (result) {
      toast.success('The event was created successfully.');
      router.push(`/event/${result.event.id}`);
    }
  }

  return (
    <div className='my-8 flex flex-col gap-6'>
      <div className='flex items-center md:items-start gap-5 md:gap-0 flex-col md:flex-row md:justify-evenly'>
        <Form {...form1}>
          <form onSubmit={form1.handleSubmit(onSubmit1)}>
            <div className='flex flex-col gap-4'>
              <FormField
                control={form1.control}
                name='dates'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Calendar
                        mode='multiple'
                        className='rounded-md border border-border w-max mx-auto'
                        selected={field.value}
                        onSelect={dates =>
                          dates ? form1.setValue('dates', dates) : null
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
                  control={form1.control}
                  name='time'
                  render={({ field }) => (
                    <FormItem>
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
                <span className='text-muted-foreground text-xs text-center'>
                  {getTimezoneString()}
                </span>
              </div>
              <Button
                disabled={watchedDates.length < 1}
                className='flex items-center gap-1 max-w-sm w-full mx-auto'
                type='submit'
              >
                <Icons.plus className='size-5' />
                <span>Add {watchedDates.length} Options</span>
              </Button>
            </div>
          </form>
        </Form>
        <Form {...form2}>
          <form id='form2' onSubmit={form2.handleSubmit(onSubmit2)}>
            <div>
              <ScrollArea className='h-80 w-72 rounded-md border border-border'>
                <div className='p-4 divide-y'>
                  <div className='flex items-center justify-between mb-2'>
                    <h2 className=' font-heading leading-none'>Options</h2>
                    <Button
                      size='sm'
                      variant='ghost'
                      className='flex items-center gap-1 text-xs hover:bg-destructive hover:text-destructive-foreground'
                      onClick={() => form2.setValue('dateTimes', [])}
                    >
                      <Icons.delete className='size-4' /> <span>Clear</span>
                    </Button>
                  </div>
                  {form2
                    .watch('dateTimes')
                    .sort((a, b) => a.getTime() - b.getTime())
                    .map((date, i) => (
                      <div
                        className='py-1 flex items-center justify-between'
                        key={i}
                      >
                        <div>
                          {date.toLocaleString([], {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                          })}
                        </div>
                        <Button
                          onClick={() => {
                            form2.setValue(
                              'dateTimes',
                              // eslint-disable-next-line react-hooks/incompatible-library
                              form2
                                .watch('dateTimes')
                                .filter((_, index) => index !== i)
                            );
                          }}
                          type='button'
                          variant='ghost'
                          size='icon'
                          className='hover:bg-destructive hover:text-destructive-foreground'
                        >
                          <Icons.close className='size-4' />
                        </Button>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
          </form>
        </Form>
      </div>
      <div className='flex justify-between'>
        <Link href='/create/date-type'>
          <Button className='flex items-center gap-1' variant={'secondary'}>
            <span>Back</span>
            <Icons.back className='text-sm' />
          </Button>
        </Link>
        <Button
          disabled={watchedDateTimes.length < 2 || isSaving}
          className='flex items-center gap-1'
          type='submit'
          form='form2'
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
  );
}
