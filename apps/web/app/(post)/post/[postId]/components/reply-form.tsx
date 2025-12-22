'use client';

import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useForm, ControllerRenderProps } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreateReply } from '@/hooks/mutations/use-create-reply';
import { TiptapInline } from './tiptap-inline';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useMobile } from '@/hooks/use-mobile';
import type { PostDetailPageData } from '@groupi/schema/data';

// Helper function to strip HTML tags and check if content is only whitespace
const stripHtmlAndCheckWhitespace = (html: string): boolean => {
  if (!html || html.trim().length === 0) return true;

  // Strip HTML tags using regex (works in all environments)
  const textContent = html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&[a-z]+;/gi, '') // Remove other HTML entities
    .trim();

  // Check if text content is only whitespace after stripping HTML
  return textContent.length === 0;
};

const formSchema = z.object({
  reply: z
    .string()
    .min(1, 'Reply must be at least 1 character')
    .max(5000, 'Reply must be 5000 characters or less')
    .refine(val => !stripHtmlAndCheckWhitespace(val), {
      message: 'Reply cannot be only whitespace',
    }),
});

export default function ReplyForm({
  postId,
  post,
}: {
  postId: string;
  userId: string;
  post: PostDetailPageData['post'];
}) {
  const createReply = useCreateReply();
  const formRef = useRef<HTMLDivElement>(null);
  const formRefForSubmit = useRef<HTMLFormElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const isMobile = useMobile();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      reply: '',
    },
  });

  // Handle sticky positioning
  useEffect(() => {
    const handleScroll = () => {
      if (!formRef.current) return;

      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollBottom = scrollTop + windowHeight;

      // Footer height is h-24 (96px)
      const footerHeight = 96;
      const distanceFromBottom = documentHeight - scrollBottom;

      // If we're within footer height + some buffer of the bottom, position above footer
      // Otherwise, stick to viewport bottom
      setIsAtBottom(distanceFromBottom <= footerHeight + 20);
    };

    handleScroll(); // Check initial state
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Clear form optimistically (immediately)
    form.reset();

    createReply.mutate(
      {
        text: values.reply,
        postId: postId,
      },
      {
        onSuccess: () => {
          // Form already cleared optimistically, but reset again as safety net
          form.reset();
        },
        onError: () => {
          toast.error('Failed to send reply', {
            description: 'The reply could not be sent. Please try again.',
          });
          // Form is already cleared, user can retype if needed
        },
      }
    );
  }

  // Check if content is actually empty (handles HTML from Tiptap)
  const isEmptyHtml = (html: string) => {
    if (!html || html.trim().length === 0) return true;
    const emptyElementPattern = /^<(\w+)(\s[^>]*)?>\s*<\/\1>$/;
    const nonAlphanumericPattern = /^[^0-9a-zA-Z]+$/;
    const trimmedHtml = html.trim();
    return (
      emptyElementPattern.test(trimmedHtml) ||
      nonAlphanumericPattern.test(trimmedHtml)
    );
  };

  const handleSubmit = async () => {
    const currentValue = form.getValues('reply');
    // If there's no content, do nothing
    if (!currentValue || isEmptyHtml(currentValue)) {
      return;
    }
    const isValid = await form.trigger('reply');
    if (isValid) {
      form.handleSubmit(onSubmit)();
    }
  };

  return (
    <div
      ref={formRef}
      data-reply-form
      className={cn(
        'z-10',
        isAtBottom ? 'relative bottom-0' : 'sticky bottom-0'
      )}
      style={isAtBottom ? { marginBottom: '96px' } : {}}
    >
      <Form {...form}>
        <form
          ref={formRefForSubmit}
          onSubmit={form.handleSubmit(onSubmit)}
          className='px-2 pb-4 pt-2'
        >
          <FormField
            control={form.control}
            name='reply'
            render={({
              field,
            }: {
              field: ControllerRenderProps<z.infer<typeof formSchema>, 'reply'>;
            }) => {
              return (
                <FormItem className='w-full'>
                  <FormControl>
                    <div className='relative'>
                      <TiptapInline
                        placeholder='Write a reply...'
                        content={field.value}
                        onChange={field.onChange}
                        preventEnterSubmit={isMobile}
                        growUpward={isMobile}
                        eventId={post.event.id}
                        members={post.event.memberships}
                        isMobile={isMobile}
                        onKeyDown={async e => {
                          // On desktop: Enter sends, Shift+Enter newline
                          // On mobile: Enter always creates newline (handled by preventEnterSubmit)
                          if (!isMobile && e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            await handleSubmit();
                          }
                        }}
                      />
                      <Button
                        type='button'
                        onClick={handleSubmit}
                        size='sm'
                        className={cn(
                          'absolute bottom-2 right-2 h-8 w-8 p-0',
                          'bg-primary text-primary-foreground',
                          'hover:bg-primary/90',
                          'shadow-md'
                        )}
                        aria-label='Send reply'
                      >
                        <Icons.submit className='h-4 w-4' />
                      </Button>
                    </div>
                  </FormControl>
                </FormItem>
              );
            }}
          />
        </form>
      </Form>
    </div>
  );
}
