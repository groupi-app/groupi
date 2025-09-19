'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
// Migrated from server actions to tRPC hooks
import { useCreateReply } from '@groupi/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';

const formSchema = z.object({
  reply: z
    .string()
    .min(1, 'Reply must be at least 1 character')
    .max(350, 'Reply must be 350 characters or less'),
});

export default function ReplyForm({
  postId,
  userId: _userId,
}: {
  postId: string;
  userId: string;
}) {
  // Use our new tRPC hook with integrated real-time sync
  const createReplyMutation = useCreateReply();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      reply: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    createReplyMutation.mutate(
      {
        text: values.reply,
        postId: postId,
      },
      {
        onSuccess: ([error, _reply]) => {
          if (error) {
            toast.error('Failed to send reply', {
              description: 'The reply could not be sent. Please try again.',
            });
            return;
          }

          form.reset();
          toast.success('Your reply has been successfully sent');
        },
        onError: () => {
          toast.error('Failed to send reply', {
            description: 'An unexpected error occurred. Please try again.',
          });
        },
      }
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className='flex gap-2'>
          <FormField
            control={form.control}
            name='reply'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormControl>
                  <Textarea
                    placeholder='Write a reply...'
                    className='resize-none'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            disabled={createReplyMutation.isLoading}
            size='sm'
            type='submit'
            className='h-20'
          >
            {createReplyMutation.isLoading ? (
              <Icons.spinner className='h-4 w-4 animate-spin' />
            ) : (
              <Icons.submit className='h-4 w-4' />
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
