'use client';
// Migrated from server actions to tRPC hooks
import { useUpdateMemberAvailabilities } from '@groupi/hooks';
import { PotentialDateTimeWithAvailabilities } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { StatusType } from '@groupi/schema';
import { useRouter } from 'next/navigation';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AvailabilityCard } from './availability-card';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { toast } from 'sonner';

export function AvailabilityForm({
  potentialDateTimes,
  userId,
}: {
  potentialDateTimes: PotentialDateTimeWithAvailabilities[];
  userId: string;
}) {
  const eventId = potentialDateTimes[0].eventId;
  const router = useRouter();

  // Use our new tRPC hook with integrated real-time sync
  const updateAvailabilitiesMutation = useUpdateMemberAvailabilities();

  const answerMap = (
    status: StatusType | undefined
  ): 'yes' | 'maybe' | 'no' => {
    // Convert status to lowercase for form
    switch (status) {
      case 'YES':
        return 'yes';
      case 'MAYBE':
        return 'maybe';
      case 'NO':
        return 'no';
      default:
        return 'no';
    }
  };

  const formSchema = z.object({
    formAnswers: z.array(
      z.object({
        potentialDateTimeId: z.string(),
        answer: z.enum(['yes', 'maybe', 'no'], {
          message: 'Please select a response for each option',
        }),
      })
    ),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      formAnswers: potentialDateTimes.map(pdt => ({
        potentialDateTimeId: pdt.id,
        answer: answerMap(
          pdt.availabilities.find(a => a.membership.personId === userId)?.status
        ),
      })),
    },
  });

  function setFormAnswers(
    answer: 'yes' | 'maybe' | 'no',
    index?: number | undefined
  ) {
    const availabilities = form.getValues(`formAnswers`);
    if (index !== undefined) {
      availabilities[index].answer = answer;
    } else {
      for (let i = 0; i < availabilities.length; i++) {
        availabilities[i].answer = answer;
      }
    }
    form.setValue(`formAnswers`, availabilities);
  }

  function toggleFormValue(
    index: number,
    value: { potentialDateTimeId: string; answer: 'yes' | 'maybe' | 'no' }
  ) {
    const availabilities = form.getValues(`formAnswers`);
    availabilities[index] = value;
    form.setValue(`formAnswers`, availabilities);
  }

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const availabilityUpdates = data.formAnswers.map(answer => ({
      potentialDateTimeId: answer.potentialDateTimeId,
      status: answer.answer.toUpperCase() as 'YES' | 'MAYBE' | 'NO',
    }));

    updateAvailabilitiesMutation.mutate(
      {
        eventId,
        availabilityUpdates,
      },
      {
        onSuccess: ([error, _result]: [Error | null, unknown]) => {
          if (error) {
            toast.error('Unable to update', {
              description:
                'There was an error updating your availability. Please try again.',
            });
            return;
          }

          toast.success('Availability Updated', {
            description: 'Your availability has been successfully updated.',
          });
          router.push(`/event/${eventId}`);
        },
        onError: () => {
          toast.error('Unable to update', {
            description: 'An unexpected error occurred. Please try again.',
          });
        },
      }
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className='flex items-center gap-2 my-2'>
          <Button
            type='button'
            onClick={() => setFormAnswers('yes')}
            className='text-muted-foreground px-3'
            variant='outline'
          >
            <div className='flex items-center gap-1'>
              <Icons.check className='size-5' />
              <span>All Yes</span>
            </div>
          </Button>
          <Button
            type='button'
            onClick={() => setFormAnswers('maybe')}
            className='text-muted-foreground px-3'
            variant='outline'
          >
            <div className='flex items-center gap-1'>
              <span className='font-semibold text-lg'>?</span>
              <span>All Maybe</span>
            </div>
          </Button>
          <Button
            type='button'
            onClick={() => setFormAnswers('no')}
            className='text-muted-foreground px-3'
            variant='outline'
          >
            <div className='flex items-center gap-1'>
              <Icons.close className='size-5' />
              <span>All No</span>
            </div>
          </Button>
        </div>
        <FormField
          control={form.control}
          name='formAnswers'
          render={() => (
            <FormItem>
              <FormControl>
                <div className='flex flex-wrap gap-2'>
                  {potentialDateTimes.map((pdt, i) => (
                    <AvailabilityCard
                      key={pdt.id}
                      pdt={pdt}
                      formAnswers={form.watch('formAnswers')}
                      setFormAnswer={toggleFormValue}
                      index={i}
                    />
                  ))}
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        <Button
          type='submit'
          disabled={
            !(
              form.watch('formAnswers').filter(a => a.answer).length ===
              form.watch('formAnswers').length
            ) || updateAvailabilitiesMutation.isLoading
          }
          className='my-2'
        >
          <div className='flex items-center gap-1'>
            {updateAvailabilitiesMutation.isLoading && (
              <Icons.spinner className='animate-spin size-5' />
            )}
            <span>Submit</span>
          </div>
        </Button>
      </form>
    </Form>
  );
}
