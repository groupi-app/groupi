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
import { createReply } from '@/lib/actions/reply';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Icons } from './icons';
import { useToast } from './ui/use-toast';

const formSchema = z.object({
  reply: z
    .string()
    .min(1, 'Reply must be at least 1 character')
    .max(350, 'Reply must be 350 characters or less'),
});

export default function ReplyForm({
  postId,
  userId,
}: {
  postId: string;
  userId: string;
}) {
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      reply: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    const res = await createReply({
      text: values.reply,
      postId: postId,
      authorId: userId,
    });

    if (res.success) {
      form.reset();
      toast({
        title: 'Reply sent',
        description: 'Your reply has been successfully sent',
      });
    } else {
      toast({
        title: 'Failed to send reply',
        description: 'The reply was unable to be sent.',
        variant: 'destructive',
      });
    }
    setIsSaving(false);
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
                    className='resize-none'
                    placeholder='Type a reply...'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            className='mt-5 flex items-center gap-1'
            type='submit'
            disabled={isSaving}
          >
            {isSaving ? (
              <Icons.spinner className='h-4 w-4 animate-spin' />
            ) : (
              <Icons.submit className='size-4' />
            )}
            Send
          </Button>
        </div>
      </form>
    </Form>
  );
}
