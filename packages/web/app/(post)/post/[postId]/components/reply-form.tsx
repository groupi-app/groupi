'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/refs */
// Type cast needed for membership data transformation to BlockNoteInline component
// Note: react-hooks/refs disabled because onSubmit accesses refs in event handler context, not during render

import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useForm, ControllerRenderProps } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreateReply, OptimisticUserData } from '@/hooks/convex/use-replies';
import { BlockNoteInline, BlockNoteInlineHandle } from './blocknote-inline';
import { useEffect, useRef, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useMobile } from '@/hooks/use-mobile';
import { Id, Doc } from '@/convex/_generated/dataModel';
import { User } from '@/convex/types';

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

// Type for userMembership prop
type UserMembershipProp = Doc<"memberships"> & {
  person: Doc<"persons"> & {
    user: User;
  };
};

export default function ReplyForm({
  postId,
  post,
  userMembership,
  onEditLastReply,
}: {
  postId: Id<"posts"> | string;
  post: {
    event?: {
      _id: Id<"events">;
      memberships?: Array<{
        _id: Id<"memberships">;
        person?: {
          _id: Id<"persons">;
          user?: {
            _id: string;
            username?: string;
            displayUsername?: string;
            name?: string;
            email?: string;
          } | null;
        } | null;
      }>;
    };
  };
  userMembership?: UserMembershipProp;
  onEditLastReply?: () => void;
}) {
  // Build current user data for optimistic updates
  const currentUser = useMemo((): OptimisticUserData | undefined => {
    if (!userMembership?.person) return undefined;
    const user = userMembership.person.user;
    return {
      // Use personId directly from membership (more reliable than person._id from spread)
      personId: userMembership.personId,
      name: user?.name || undefined,
      email: user?.email || undefined,
      image: user?.image || undefined,
      username: user?.username || undefined,
    };
  }, [userMembership]);

  const createReply = useCreateReply(currentUser);
  const formRef = useRef(null);
  const formRefForSubmit = useRef(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<BlockNoteInlineHandle>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isMultiline, setIsMultiline] = useState(false);
  const isMobile = useMobile();

  // Track editor height to determine if content is multiline
  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container) return;

    const checkHeight = () => {
      // BlockNote adds internal structure, so single line can be ~50-60px
      // Only consider multiline if significantly taller
      const isMulti = container.scrollHeight > 70;
      setIsMultiline(isMulti);
    };

    // Check on mount and set up observer for changes
    checkHeight();
    const observer = new ResizeObserver(checkHeight);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      reply: '',
    },
  });

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

  // Handle up arrow to edit last reply (document-level handler for reliability)
  useEffect(() => {
    if (!onEditLastReply) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowUp') return;

      // Check if focus is within the editor container
      const container = editorContainerRef.current;
      if (!container || !container.contains(document.activeElement)) return;

      const currentValue = form.getValues('reply');
      // Check if field is empty - BlockNote may output empty string or minimal HTML
      const isEmpty = !currentValue ||
        currentValue.trim() === '' ||
        currentValue === '<p></p>' ||
        currentValue === '<p><br></p>' ||
        isEmptyHtml(currentValue);

      if (isEmpty) {
        e.preventDefault();
        e.stopPropagation();
        onEditLastReply();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [onEditLastReply, form]);

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Clear form and editor optimistically (immediately), keeping focus
    form.reset();
    editorRef.current?.clear();

    try {
      await createReply({
        text: values.reply,
        postId: postId as import('@/convex/_generated/dataModel').Id<"posts">,
      });
      // Form already cleared optimistically
    } catch {
      toast.error('Failed to send reply', {
        description: 'The reply could not be sent. Please try again.',
      });
      // Form is already cleared, user can retype if needed
    }
  }

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
        'z-20 bg-background',
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
                    <div className='relative' ref={editorContainerRef}>
                      <BlockNoteInline
                        ref={editorRef}
                        placeholder='Write a reply...'
                        content={field.value}
                        onChange={field.onChange}
                        preventEnterSubmit={isMobile}
                        growUpward={isMobile}
                        eventId={post.event?._id}
                        members={(post.event?.memberships as any) || []}
                        isMobile={isMobile}
                        onKeyDown={async e => {
                          // On desktop: Enter sends, Shift+Enter newline
                          // On mobile: Enter always creates newline (handled by preventEnterSubmit)
                          if (!isMobile && e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            await handleSubmit();
                          }
                          // Up arrow when field is empty: edit last reply
                          if (e.key === 'ArrowUp' && onEditLastReply) {
                            const currentValue = form.getValues('reply');
                            // Check if field is empty - BlockNote may output empty string or minimal HTML
                            const isEmpty = !currentValue ||
                              currentValue.trim() === '' ||
                              isEmptyHtml(currentValue) ||
                              currentValue === '<p></p>' ||
                              currentValue === '<p><br></p>';
                            if (isEmpty) {
                              e.preventDefault();
                              e.stopPropagation();
                              onEditLastReply();
                            }
                          }
                        }}
                      />
                      <Button
                        type='button'
                        onClick={handleSubmit}
                        size='sm'
                        className={cn(
                          'absolute right-2 h-8 w-8 p-0',
                          'bg-primary text-primary-foreground',
                          'hover:bg-primary/90',
                          'shadow-md',
                          isMultiline
                            ? 'bottom-2'
                            : 'top-1/2 -translate-y-1/2'
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
