'use client';
import { Calendar } from '@/components/ui/calendar';
import { useResetChosenDate } from '@/hooks/mutations/use-reset-chosen-date';
import { useUpdatePotentialDateTimes } from '@/hooks/mutations/use-update-potential-date-times';
import { merge } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import type { AvailabilityPageData, EventHeaderData } from '@groupi/schema/data';
import { componentLogger } from '@/lib/logger';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

export function EditEventMultiDate({
  eventId,
  dates,
}: {
  eventId: string;
  dates: Date[] | undefined;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const resetChosenDate = useResetChosenDate();
  const updatePotentialDateTimes = useUpdatePotentialDateTimes();

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
      dateTimes: dates ?? [],
    },
  });

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

  async function onSubmit2() {
    const startTime = performance.now();
    componentLogger.debug({ eventId, timestamp: startTime }, 'onSubmit2: Starting');
    
    setIsUpdating(true);
    const dialogCloseTime = performance.now();
    componentLogger.debug({ eventId, elapsed: dialogCloseTime - startTime }, 'onSubmit2: Dialog closed');
    
    setDialogOpen(false); // Close dialog immediately

    const dateTimes = form2.getValues('dateTimes');
    const getDateTimesTime = performance.now();
    componentLogger.debug({ eventId, elapsed: getDateTimesTime - startTime, dateCount: dateTimes.length }, 'onSubmit2: Got date times');
    
    // Manually apply optimistic updates synchronously (before navigation)
    // This ensures the cache is updated instantly without waiting for async onMutate
    const oldAvailabilityData = queryClient.getQueryData<AvailabilityPageData>(
      qk.availability.data(eventId)
    );
    const getCacheTime = performance.now();
    componentLogger.debug({ eventId, elapsed: getCacheTime - startTime, hasOldData: !!oldAvailabilityData }, 'onSubmit2: Got cache data');
    
    // Find organizer's membership
    let organizerMembership: AvailabilityPageData['potentialDateTimes'][0]['availabilities'][0]['membership'] | null = null;
    
    if (oldAvailabilityData) {
      for (const pdt of oldAvailabilityData.potentialDateTimes) {
        const organizerAvail = pdt.availabilities.find(
          avail => avail.membership.role === 'ORGANIZER'
        );
        if (organizerAvail) {
          organizerMembership = organizerAvail.membership;
          break;
        }
      }
    }

    // If not found in availability data, try to get from memberships list cache
    if (!organizerMembership) {
      const membershipsData = queryClient.getQueryData<{
        event: {
          memberships: Array<{
            id: string;
            personId: string;
            eventId: string;
            role: 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE';
            rsvpStatus: 'YES' | 'MAYBE' | 'NO' | 'PENDING';
            person: {
              id: string;
              user: {
                name: string | null;
                email: string;
                image: string | null;
                username: string | null;
              };
            };
          }>;
        };
      }>(qk.memberships.list(eventId));

      if (membershipsData) {
        const organizer = membershipsData.event.memberships.find(
          m => m.role === 'ORGANIZER'
        );
        if (organizer) {
          organizerMembership = {
            id: organizer.id,
            personId: organizer.personId,
            eventId: organizer.eventId,
            role: organizer.role,
            rsvpStatus: organizer.rsvpStatus,
            person: {
              id: organizer.person.id,
              user: organizer.person.user,
            },
          };
        }
      }
    }

    // Optimistically update availability data
    const beforeMapTime = performance.now();
    componentLogger.debug({ eventId, elapsed: beforeMapTime - startTime }, 'onSubmit2: Before mapping date times');
    
    const newPotentialDateTimes = dateTimes.map((dt, index) => {
      const availabilities = organizerMembership
        ? [
            {
              status: 'YES' as const,
              membership: organizerMembership,
            },
          ]
        : [];

      return {
        id: `temp-${index}-${Date.now()}`,
        eventId: eventId,
        dateTime: dt,
        availabilities,
      };
    });
    const afterMapTime = performance.now();
    componentLogger.debug({ eventId, elapsed: afterMapTime - startTime, mappedCount: newPotentialDateTimes.length }, 'onSubmit2: After mapping date times');

    const beforeSetAvailabilityTime = performance.now();
    queryClient.setQueryData<AvailabilityPageData>(
      qk.availability.data(eventId),
      (old: AvailabilityPageData | undefined) => {
        if (!old) {
          return {
            potentialDateTimes: newPotentialDateTimes,
            userRole: 'ORGANIZER' as const,
            userId: organizerMembership?.personId || '',
          };
        }
        return {
          ...old,
          potentialDateTimes: newPotentialDateTimes,
        };
      }
    );
    const afterSetAvailabilityTime = performance.now();
    componentLogger.debug({ eventId, elapsed: afterSetAvailabilityTime - startTime, setTime: afterSetAvailabilityTime - beforeSetAvailabilityTime }, 'onSubmit2: Set availability cache');

    // Optimistically update event header (set chosenDateTime to null)
    const beforeSetHeaderTime = performance.now();
    queryClient.setQueryData<EventHeaderData>(
      qk.events.header(eventId),
      (old: EventHeaderData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          event: {
            ...old.event,
            chosenDateTime: null,
          },
        };
      }
    );
    const afterSetHeaderTime = performance.now();
    componentLogger.debug({ eventId, elapsed: afterSetHeaderTime - startTime, setTime: afterSetHeaderTime - beforeSetHeaderTime }, 'onSubmit2: Set header cache');

    // Navigate immediately after synchronous cache updates
    const beforeNavTime = performance.now();
    componentLogger.debug({ eventId, elapsed: beforeNavTime - startTime }, 'onSubmit2: About to navigate');
    router.push(`/event/${eventId}`);
    const afterNavTime = performance.now();
    componentLogger.debug({ eventId, elapsed: afterNavTime - startTime, navTime: afterNavTime - beforeNavTime }, 'onSubmit2: Navigation called');
    
    // Start mutations in background (they'll update cache with real data when complete)
    const beforeMutationsTime = performance.now();
    componentLogger.debug({ eventId, elapsed: beforeMutationsTime - startTime }, 'onSubmit2: About to start mutations');
    
    updatePotentialDateTimes.mutate(
      { eventId, potentialDateTimes: dateTimes },
      {
        onSuccess: () => {
          const successTime = performance.now();
          componentLogger.debug({ eventId, elapsed: successTime - startTime }, 'onSubmit2: updatePotentialDateTimes success');
          toast.success('New poll started successfully.');
          setIsUpdating(false);
        },
        onError: () => {
          const errorTime = performance.now();
          componentLogger.debug({ eventId, elapsed: errorTime - startTime }, 'onSubmit2: updatePotentialDateTimes error');
          toast.error('Failed to start new poll', {
            description: 'An unexpected error occurred. Please try again.',
          });
          setIsUpdating(false);
        },
      }
    );

    resetChosenDate.mutate(
      { eventId },
      {
        onError: () => {
          componentLogger.debug({ eventId }, 'onSubmit2: resetChosenDate error');
          toast.error('Failed to reset date', {
            description: 'An unexpected error occurred. Please try again.',
          });
        },
      }
    );
    
    const afterMutationsTime = performance.now();
    componentLogger.debug({ eventId, elapsed: afterMutationsTime - startTime, mutationsTime: afterMutationsTime - beforeMutationsTime }, 'onSubmit2: Mutations started, function complete');
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
                disabled={form1.watch('dates').length < 1}
                className='flex items-center gap-1 max-w-sm w-full mx-auto'
                type='submit'
              >
                <Icons.plus className='size-5' />
                <span>Add {form1.watch('dates').length} Options</span>
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
        <Link href={`/event/${eventId}/change-date`}>
          <Button className='flex items-center gap-1' variant={'secondary'}>
            <span>Back</span>
            <Icons.back className='text-sm' />
          </Button>
        </Link>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              disabled={form2.watch('dateTimes').length < 2}
              data-test='new-event-single-submit'
              className='flex items-center gap-1'
              type='button'
            >
              Submit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Run New Date/Time Poll?</DialogTitle>
              <DialogDescription>
                Are you sure you want to start a new date/time poll? This will
                override any existing polls.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant='ghost'>Cancel</Button>
              </DialogClose>
              <Button
                className='flex items-center gap-1'
                type='submit'
                form='form2'
                disabled={isUpdating || form2.watch('dateTimes').length < 2}
              >
                {isUpdating ? (
                  <Icons.spinner className='h-4 w-4 animate-spin' />
                ) : (
                  <></>
                )}
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
