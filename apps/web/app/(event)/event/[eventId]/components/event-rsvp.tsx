'use client';

// Migrated from server actions to tRPC hooks
import { useUpdateRSVP } from '@groupi/hooks';
import { MembershipWithAvailabilities } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { toast } from 'sonner';

export function EventRSVP({
  title,
  dateTime,
  userMembership,
}: {
  title: string;
  dateTime: Date | null;
  userMembership: MembershipWithAvailabilities;
}) {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  // Use our new tRPC hook with integrated real-time sync
  const updateRSVPMutation = useUpdateRSVP();

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const [error] = await updateRSVPMutation.updateRSVP({
      eventId: userMembership.eventId,
      status: values.rsvp,
    });
    if (error) {
      toast.error('Failed to update RSVP', {
        description: 'Your RSVP status could not be updated. Please try again.',
      });
      return;
    }
    setDialogOpen(false);
    toast.success('Your RSVP status has been successfully updated');
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
          <h1 className='text-2xl font-heading'>RSVP</h1>
        </DialogHeader>
        <DialogDescription>
          Will you be attending{' '}
          <span className='text-foreground font-semibold'>{title}</span> on{' '}
          <span className='text-foreground font-semibold'>
            {dateTime?.toLocaleString([], {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
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
                      disabled={updateRSVPMutation.isLoading}
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
                      disabled={updateRSVPMutation.isLoading}
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
                      disabled={updateRSVPMutation.isLoading}
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
                  updateRSVPMutation.isLoading ||
                  !form.formState.isValid ||
                  form.watch('rsvp') === 'PENDING'
                }
              >
                {updateRSVPMutation.isLoading ? (
                  <Icons.spinner className='h-4 w-4 animate-spin' />
                ) : (
                  <Icons.save className='size-4' />
                )}
                Save
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
