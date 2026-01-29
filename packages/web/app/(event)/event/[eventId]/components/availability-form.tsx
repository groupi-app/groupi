'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { AvailabilityCard } from './availability-card';
import { Icons } from '@/components/icons';
// Use simpler Convex generated types to avoid deep type issues
import { Doc, Id } from '../../../../../../../convex/_generated/dataModel';
import { User } from '@/convex/types';

// Match the actual Convex query return type structure
type PotentialDateTime = Doc<'potentialDateTimes'> & {
  availabilities: Array<
    Doc<'availabilities'> & {
      member: Doc<'memberships'> & {
        person:
          | (Doc<'persons'> & {
              user: User;
            })
          | null;
      };
    }
  >;
};
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { toast } from 'sonner';
import { useSubmitAvailability } from '@/hooks/convex/use-availability';

export function AvailabilityForm({
  potentialDateTimes,
  userId,
}: {
  potentialDateTimes: PotentialDateTime[];
  userId: Id<'persons'>;
}) {
  const eventId = potentialDateTimes[0].eventId;
  const router = useRouter();
  const submitAvailability = useSubmitAvailability();
  const [isSaving, setIsSaving] = useState(false);

  const answerMap = (
    status: 'YES' | 'MAYBE' | 'NO' | 'PENDING' | undefined
  ) => {
    // Convert status to lowercase for form
    switch (status) {
      case 'YES':
        return 'yes';
      case 'MAYBE':
        return 'maybe';
      case 'NO':
        return 'no';
      case 'PENDING':
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
        potentialDateTimeId: pdt._id,
        answer: answerMap(
          pdt.availabilities.find(a => a.member?.personId === userId)?.status
        ),
      })),
    },
  });

  // Update form when potentialDateTimes changes (e.g., new poll started)
  useEffect(() => {
    const currentAnswers = form.getValues('formAnswers');
    const currentIds = new Set(currentAnswers.map(a => a.potentialDateTimeId));
    const newIds = new Set(potentialDateTimes.map(pdt => pdt._id as string));

    // Check if there are new potential date times
    const hasNewDates = potentialDateTimes.some(
      pdt => !currentIds.has(pdt._id as string)
    );
    const hasRemovedDates = currentAnswers.some(
      a => !newIds.has(a.potentialDateTimeId)
    );

    if (hasNewDates || hasRemovedDates) {
      // Reset form with updated potential date times
      form.reset({
        formAnswers: potentialDateTimes.map(pdt => {
          // Try to preserve existing answer if this date time already exists
          const existingAnswer = currentAnswers.find(
            a => a.potentialDateTimeId === pdt._id
          );
          if (existingAnswer) {
            return existingAnswer;
          }
          // Otherwise, use the availability from the server or default to 'no'
          return {
            potentialDateTimeId: pdt._id,
            answer: answerMap(
              pdt.availabilities.find(a => a.member?.personId === userId)
                ?.status
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

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsSaving(true);
    const responses = data.formAnswers.map(answer => ({
      potentialDateTimeId:
        answer.potentialDateTimeId as Id<'potentialDateTimes'>,
      status: answer.answer.toUpperCase() as 'YES' | 'MAYBE' | 'NO',
    }));

    try {
      // Show optimistic toast and navigation
      toast.success('Availability Updated', {
        description: 'Your availability has been successfully updated.',
      });
      router.push(`/event/${eventId}`);

      // Handle mutation in background
      await submitAvailability({
        eventId,
        responses,
      });
    } catch {
      // Rollback navigation and show error toast
      router.push(`/event/${eventId}/availability`);
      toast.error('Unable to update', {
        description:
          'There was an error updating your availability. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className='flex items-center gap-2 my-4'>
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
                <div className='flex flex-wrap gap-4'>
                  {potentialDateTimes.map((pdt, i) => (
                    <AvailabilityCard
                      key={pdt._id}
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
            isSaving ||
            !(
              form
                .watch('formAnswers')
                .filter((a: { answer: string }) => a.answer).length ===
              form.watch('formAnswers').length
            )
          }
          className='my-4'
          isLoading={isSaving}
          loadingText='Submitting...'
        >
          <span>Submit</span>
        </Button>
      </form>
    </Form>
  );
}
