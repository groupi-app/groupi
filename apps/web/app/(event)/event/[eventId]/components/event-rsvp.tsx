'use client';

import { MembershipWithAvailabilities } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Icons } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { toast } from 'sonner';
import { useUpdateRSVP } from '@/hooks/mutations/use-update-rsvp';
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import type { EventHeaderData } from '@groupi/schema/data';
import { fetchEventHeader } from '@/lib/queries/event-queries';

export function EventRSVP({
  title,
  dateTime,
  userMembership: initialUserMembership,
  eventId,
}: {
  title: string;
  dateTime: Date | string | null;
  userMembership: MembershipWithAvailabilities;
  eventId: string;
}) {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const updateRSVP = useUpdateRSVP();

  // Subscribe to React Query cache to get reactive updates
  const { data: eventHeaderData } = useQuery({
    queryKey: qk.events.header(eventId),
    queryFn: () => fetchEventHeader(eventId),
    initialData: {
      event: {
        id: eventId,
        title: '',
        description: '',
        location: '',
        chosenDateTime: null,
      },
      userMembership: initialUserMembership,
    } as EventHeaderData,
    staleTime: 5 * 60 * 1000,
    select: data => data.userMembership, // Extract userMembership for reactivity
  });

  const userMembership = eventHeaderData || initialUserMembership;

  const formSchema = z.object({
    rsvp: z.enum(['YES', 'NO', 'MAYBE', 'PENDING']),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      rsvp: userMembership.rsvpStatus,
    },
  });

  // Reset form when RSVP status changes (from optimistic updates or Pusher)
  useEffect(() => {
    form.reset({
      rsvp: userMembership.rsvpStatus,
    });
  }, [userMembership.rsvpStatus, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Close dialog immediately for instant feedback (optimistic update handles UI)
    setDialogOpen(false);

    updateRSVP.mutate(
      {
        eventId: eventId,
        status: values.rsvp,
      },
      {
        onSuccess: () => {
          toast.success('Your RSVP status has been successfully updated');
        },
        onError: () => {
          toast.error('Failed to update RSVP', {
            description:
              'Your RSVP status could not be updated. Please try again.',
          });
        },
      }
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {dateTime != null &&
        userMembership.role !== 'ORGANIZER' &&
        (userMembership.rsvpStatus !== 'PENDING' ? (
          <DialogTrigger asChild>
            <Button
              className='flex items-center gap-3 w-max text-muted-foreground'
              variant={'ghost'}
              size={'sm'}
            >
              <span className='text-primary font-semibold'>RSVP:</span>
              <div className='flex items-center gap-1'>
                {userMembership.rsvpStatus === 'YES' ? (
                  <Icons.check className='text-green-500' />
                ) : userMembership.rsvpStatus === 'NO' ? (
                  <Icons.close className='text-red-500' />
                ) : (
                  <span className='font-semibold w-6 text-xl text-yellow-500 text-center'>
                    ?
                  </span>
                )}
                <span>{userMembership.rsvpStatus}</span>
              </div>
              <Icons.arrowRight className='size-4' />
            </Button>
          </DialogTrigger>
        ) : (
          <DialogTrigger asChild>
            <Alert className='hover:bg-accent transition-all cursor-pointer group'>
              <div className='flex items-center justify-between'>
                <div>
                  <AlertTitle className='flex items-center gap-1'>
                    <Icons.info className='size-6 text-primary' />{' '}
                    <span>Your RSVP is Pending!</span>
                  </AlertTitle>
                  <AlertDescription className='text-muted-foreground'>
                    Please click here to RSVP to this event.
                  </AlertDescription>
                </div>
                <Icons.arrowRight className='size-6 text-muted-foreground ' />
              </div>
            </Alert>
          </DialogTrigger>
        ))}
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='text-2xl font-heading'>RSVP</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Will you be attending{' '}
          <span className='text-foreground font-semibold'>{title}</span> on{' '}
          <span className='text-foreground font-semibold'>
            {dateTime
              ? (dateTime instanceof Date
                  ? dateTime
                  : new Date(dateTime)
                ).toLocaleString([], {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })
              : null}
          </span>
          ?
        </DialogDescription>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name='rsvp'
              render={({ field }) => (
                <FormItem className='flex gap-2 items-center space-y-0'>
                  <FormControl className='w-1/3'>
                    <Button
                      type='button'
                      variant={field.value === 'YES' ? 'default' : 'outline'}
                      onClick={() => field.onChange('YES')}
                    >
                      <div className='flex items-center gap-1 pr-2'>
                        <Icons.check className='text-green-500' />
                        <span>Yes</span>
                      </div>
                    </Button>
                  </FormControl>
                  <FormControl className='w-1/3'>
                    <Button
                      type='button'
                      variant={field.value === 'MAYBE' ? 'default' : 'outline'}
                      onClick={() => field.onChange('MAYBE')}
                    >
                      <div className='flex items-center gap-1 pr-2'>
                        <span className='font-semibold w-6 text-xl text-yellow-500 text-center'>
                          ?
                        </span>
                        <span>Maybe</span>
                      </div>
                    </Button>
                  </FormControl>
                  <FormControl className='w-1/3'>
                    <Button
                      type='button'
                      variant={field.value === 'NO' ? 'default' : 'outline'}
                      onClick={() => field.onChange('NO')}
                    >
                      <div className='flex items-center gap-1 pr-2'>
                        <Icons.close className='text-red-500' />
                        <span>No</span>
                      </div>
                    </Button>
                  </FormControl>
                </FormItem>
              )}
            />
            <div className='flex justify-end'>
              <Button
                className='mt-5 flex items-center gap-1 w-full sm:w-auto'
                type='submit'
                disabled={
                  !form.formState.isValid ||
                  // eslint-disable-next-line react-hooks/incompatible-library
                  form.watch('rsvp') === 'PENDING'
                }
              >
                <Icons.save className='size-4' />
                Save
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
