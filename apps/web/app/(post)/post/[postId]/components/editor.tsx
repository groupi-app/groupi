'use client';

import { Icons } from '@/components/icons';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useCreatePost } from '@/hooks/mutations/use-create-post';
import { useUpdatePost } from '@/hooks/mutations/use-update-post';
import * as z from 'zod';
import { Tiptap } from './tiptap';
import { Button } from '@/components/ui/button';
import { componentLogger } from '@/lib/logger';
import { useQuery } from '@tanstack/react-query';
import { fetchMemberList } from '@/lib/queries/membership-queries';
import { qk } from '@/lib/query-keys';
import type { PostDetailPageData } from '@groupi/schema/data';

type Member = PostDetailPageData['post']['event']['memberships'][0];

interface PostData {
  title: string;
  content: string;
  id: string;
}

/**
 * Post editor component.
 *
 * Form state is explicitly cleared on:
 * - Successful submit (post created/updated)
 * - User clicking "Leave" in the unsaved changes dialog
 *
 * @see docs/STATE_ARCHITECTURE.md for the full state management guide
 */
export function Editor({
  eventId,
  postData,
}: {
  eventId: string;
  postData?: PostData;
}) {
  const [titleEdited, setTitleEdited] = useState<boolean>(false);
  const [contentEdited, setContentEdited] = useState<boolean>(false);

  // Reset key for TipTap - incremented to force content sync
  const [editorResetKey, setEditorResetKey] = useState(0);

  const backUrl = postData ? `/post/${postData.id}` : `/event/${eventId}`;
  const title = postData?.title || '';
  const content = postData?.content || '';

  const formSchema = z.object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(100, 'Your title is too long!')
      .refine(val => val.trim().length > 0, {
        message: 'Title cannot be only whitespace',
      }),
    content: z
      .string()
      .trim()
      .min(1, 'Post body is required')
      .max(3000, 'Your post is too long!')
      .refine(val => val.trim().length > 0, {
        message: 'Post body cannot be only whitespace',
      }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      title: title,
      content: content,
    },
  });

  const router = useRouter();
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();

  // Fetch members for mention functionality
  const { data: memberListData } = useQuery({
    queryKey: qk.memberships.list(eventId),
    queryFn: () => fetchMemberList(eventId),
    enabled: !!eventId,
    staleTime: 2 * 60 * 1000,
  });

  const members: Member[] =
    (memberListData?.event.memberships.map(m => ({
      id: m.id,
      role: m.role,
      rsvpStatus: m.rsvpStatus,
      personId: m.personId,
      eventId: m.eventId,
      person: {
        id: m.person.id,
        createdAt: new Date(), // Default value since EventAttendeesPageData doesn't include this
        updatedAt: new Date(), // Default value since EventAttendeesPageData doesn't include this
        user: {
          name: m.person.user?.name || null,
          email: m.person.user?.email || '',
          image: m.person.user?.image || null,
          username: m.person.user?.username || null,
        },
      },
    })) as Member[]) || [];

  // Reset form and related state - called explicitly on leave/submit
  const resetFormState = useCallback(() => {
    form.reset(
      {
        title: title,
        content: content,
      },
      {
        keepErrors: false, // Clear any validation errors
      }
    );
    // Also explicitly clear errors to ensure they're gone
    form.clearErrors();
    setTitleEdited(false);
    setContentEdited(false);
    // Increment reset key to force TipTap to sync content
    setEditorResetKey(prev => prev + 1);
  }, [form, title, content]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!postData) {
      // Create new post
      createPost.mutate(
        {
          title: values.title,
          content: values.content,
          eventId,
        },
        {
          onSuccess: () => {
            // Clear form before navigating away
            resetFormState();
            toast.success('Your post has been successfully created.');
            router.push(`/event/${eventId}`);
          },
          onError: error => {
            componentLogger.error(
              {
                error,
                errorType: error?.constructor?.name,
                errorMessage:
                  error instanceof Error ? error.message : String(error),
                eventId,
              },
              'Failed to create post'
            );
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred. Please try again.';
            toast.error('Failed to create post', {
              description: errorMessage,
            });
          },
        }
      );
    } else {
      // Update existing post
      updatePost.mutate(
        {
          id: postData.id,
          title: values.title,
          content: values.content,
        },
        {
          onSuccess: () => {
            // Clear form before navigating away
            resetFormState();
            toast.success('Your post has been successfully edited.');
            router.push(`/post/${postData.id}`);
          },
          onError: () => {
            toast.error('Failed to update post', {
              description: 'An unexpected error occurred. Please try again.',
            });
          },
        }
      );
    }
  }

  const isSaving = createPost.isPending || updatePost.isPending;

  const contentEditedOnChange = (c: string) => {
    if (c !== content) {
      setContentEdited(true);
    } else {
      setContentEdited(false);
    }
  };

  return (
    <div>
      <Dialog>
        {(titleEdited || contentEdited) && (
          <DialogTrigger asChild>
            <Button
              variant={'ghost'}
              className='flex items-center gap-1 pl-2 mb-4'
            >
              <Icons.back />
              <span>Back</span>
            </Button>
          </DialogTrigger>
        )}
        {!titleEdited && !contentEdited && (
          <Link href={backUrl}>
            <Button
              variant={'ghost'}
              className='flex items-center gap-1 pl-2 mb-4'
            >
              <Icons.back />
              <span>Back</span>
            </Button>
          </Link>
        )}
        <Form {...form}>
          <form
            className='flex flex-col gap-5'
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      data-test='post-editor-title'
                      className='text-4xl md:text-5xl font-heading font-medium border-none py-10 mb-2'
                      placeholder='Post Title'
                      value={field.value}
                      onChange={field.onChange}
                      onChangeCapture={e => {
                        if (e.currentTarget.value !== title) {
                          setTitleEdited(true);
                        } else {
                          setTitleEdited(false);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage data-test='post-editor-title-error' />
                </FormItem>
              )}
            />
            {titleEdited && postData && (
              <span
                data-test='post-editor-title-edited'
                className='text-sm text-muted-foreground -mt-2'
              >
                Edited
              </span>
            )}
            <FormField
              control={form.control}
              name='content'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Tiptap
                      data-test='post-editor-body'
                      placeholder='Type your post here.'
                      content={field.value}
                      onChange={field.onChange}
                      onChangeCapture={contentEditedOnChange}
                      resetKey={editorResetKey}
                      eventId={eventId}
                      members={members}
                    />
                  </FormControl>
                  <FormMessage data-test='post-editor-body-error' />
                </FormItem>
              )}
            />
            {contentEdited && postData && (
              <span
                data-test='post-editor-content-edited'
                className='text-sm text-muted-foreground -mt-2'
              >
                Edited
              </span>
            )}

            <div className='flex items-center gap-2'>
              <Button
                data-test='post-editor-submit'
                disabled={isSaving}
                type='submit'
                size='lg'
                className='w-full'
              >
                {isSaving && (
                  <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                )}
                {postData ? 'Update Post' : 'Create Post'}
              </Button>
            </div>
          </form>
        </Form>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to leave without
              saving?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className='flex items-center gap-2'>
              <DialogClose asChild>
                <Button variant='ghost'>Stay</Button>
              </DialogClose>
              <DialogClose asChild>
                <Link href={backUrl} onClick={resetFormState}>
                  <Button variant='destructive'>Leave</Button>
                </Link>
              </DialogClose>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
