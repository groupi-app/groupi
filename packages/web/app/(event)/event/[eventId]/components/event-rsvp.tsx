'use client';

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
import { useEventHeaderData, useUpdateRSVP } from '@/hooks/convex/use-events';
import { Id } from '@/convex/_generated/dataModel';

// Form schema defined outside component for stability
const formSchema = z.object({
  rsvp: z.enum(['YES', 'NO', 'MAYBE', 'PENDING']),
});

export function EventRSVP({ eventId }: { eventId: Id<'events'> }) {
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const updateRSVP = useUpdateRSVP();

  // Use Convex hook for real-time event header data
  const eventHeaderData = useEventHeaderData(eventId);

  // Form hook - must be called unconditionally
  // Use undefined-safe default values since data may not be loaded yet
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      rsvp: eventHeaderData?.userMembership?.rsvpStatus ?? 'PENDING',
    },
  });

  // Reset form when RSVP status changes (from optimistic updates or Pusher)
  useEffect(() => {
    if (eventHeaderData?.userMembership?.rsvpStatus) {
      form.reset({
        rsvp: eventHeaderData.userMembership.rsvpStatus,
      });
    }
  }, [eventHeaderData?.userMembership?.rsvpStatus, form]);

  // Loading state - AFTER all hooks are called
  if (eventHeaderData === undefined) {
    return (
      <div className='animate-pulse'>
        <div className='h-8 bg-muted rounded w-32'></div>
      </div>
    );
  }

  const { event, userMembership } = eventHeaderData;
  const title = event.title;
  const dateTime = event.chosenDateTime ? new Date(event.chosenDateTime) : null;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    // Close dialog immediately for instant feedback (optimistic update handles UI)
    setDialogOpen(false);

    try {
      await updateRSVP({
        eventId: eventId,
        rsvpStatus: values.rsvp,
      });
      toast.success('Your RSVP status has been successfully updated');
    } catch {
      toast.error('Failed to update RSVP', {
        description: 'Your RSVP status could not be updated. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
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
                  isSaving ||
                  !form.formState.isValid ||
                  form.watch('rsvp') === 'PENDING'
                }
                isLoading={isSaving}
                loadingText='Saving...'
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
