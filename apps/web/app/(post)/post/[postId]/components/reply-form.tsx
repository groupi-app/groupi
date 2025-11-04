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
import { createReplyAction } from '@/actions/reply-actions';
import { zodResolver } from '@hookform/resolvers/zod';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { useState } from 'react';

const formSchema = z.object({
  reply: z
    .string()
    .min(1, 'Reply must be at least 1 character')
    .max(350, 'Reply must be 350 characters or less'),
});

export default function ReplyForm({
  postId,
}: {
  postId: string;
  userId: string;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      reply: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const [error] = await createReplyAction({
      text: values.reply,
      postId: postId,
    });

    if (error) {
      toast.error('Failed to send reply', {
        description: 'The reply could not be sent. Please try again.',
      });
      setIsLoading(false);
    } else {
      form.reset();
      toast.success('Your reply has been successfully sent');
      setIsLoading(false);
    }
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
          <Button disabled={isLoading} size='sm' type='submit' className='h-20'>
            {isLoading ? (
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
