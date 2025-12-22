'use client';
import { PotentialDateTimeWithAvailabilities } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { StatusType } from '@groupi/schema';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { z } from 'zod';
import { AvailabilityCard } from './availability-card';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { toast } from 'sonner';
import { useUpdateAvailability } from '@/hooks/mutations/use-update-availability';

export function AvailabilityForm({
  potentialDateTimes,
  userId,
}: {
  potentialDateTimes: PotentialDateTimeWithAvailabilities[];
  userId: string;
}) {
  const eventId = potentialDateTimes[0].eventId;
  const router = useRouter();
  const updateAvailability = useUpdateAvailability();

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

  // Update form when potentialDateTimes changes (e.g., new poll started)
  useEffect(() => {
    const currentAnswers = form.getValues('formAnswers');
    const currentIds = new Set(currentAnswers.map(a => a.potentialDateTimeId));
    const newIds = new Set(potentialDateTimes.map(pdt => pdt.id));

    // Check if there are new potential date times
    const hasNewDates = potentialDateTimes.some(pdt => !currentIds.has(pdt.id));
    const hasRemovedDates = currentAnswers.some(a => !newIds.has(a.potentialDateTimeId));

    if (hasNewDates || hasRemovedDates) {
      // Reset form with updated potential date times
      form.reset({
        formAnswers: potentialDateTimes.map(pdt => {
          // Try to preserve existing answer if this date time already exists
          const existingAnswer = currentAnswers.find(
            a => a.potentialDateTimeId === pdt.id
          );
          if (existingAnswer) {
            return existingAnswer;
          }
          // Otherwise, use the availability from the server or default to 'no'
          return {
            potentialDateTimeId: pdt.id,
            answer: answerMap(
              pdt.availabilities.find(a => a.membership.personId === userId)?.status
            ),
          };
        }),
      });
    }
  }, [potentialDateTimes, form, userId]);

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

  function onSubmit(data: z.infer<typeof formSchema>) {
    const availabilityUpdates = data.formAnswers.map(answer => ({
      potentialDateTimeId: answer.potentialDateTimeId,
      status: answer.answer.toUpperCase() as 'YES' | 'MAYBE' | 'NO',
    }));

    // Show toast and redirect immediately (optimistic)
    toast.success('Availability Updated', {
      description: 'Your availability has been successfully updated.',
    });
    router.push(`/event/${eventId}`);

    // Handle mutation in background
    updateAvailability.mutate(
      {
        eventId,
        availabilityUpdates,
      },
      {
        onError: () => {
          // Rollback navigation and show error toast
          router.push(`/event/${eventId}/availability`);
          toast.error('Unable to update', {
            description:
              'There was an error updating your availability. Please try again.',
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
                      // eslint-disable-next-line react-hooks/incompatible-library
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
              form
                .watch('formAnswers')
                .filter((a: { answer: string }) => a.answer).length ===
              form.watch('formAnswers').length
            )
          }
          className='my-2'
        >
          <span>Submit</span>
        </Button>
      </form>
    </Form>
  );
}
