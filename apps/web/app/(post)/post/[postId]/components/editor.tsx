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
// Migrated from server actions to tRPC hooks
import { useCreatePost, useUpdatePost } from '@groupi/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Tiptap } from './tiptap';
import { Button } from '@/components/ui/button';

interface PostData {
  title: string;
  content: string;
  id: string;
}

export function Editor({
  eventId,
  postData,
}: {
  eventId: string;
  postData?: PostData;
}) {
  const [titleEdited, setTitleEdited] = useState<boolean>(false);
  const [contentEdited, setContentEdited] = useState<boolean>(false);
  const backUrl = postData ? `/post/${postData.id}` : `/event/${eventId}`;
  const title = postData?.title || '';
  const content = postData?.content || '';

  // Use our new tRPC hooks with integrated real-time sync
  const createPostMutation = useCreatePost();
  const updatePostMutation = useUpdatePost();

  const formSchema = z.object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(100, 'Your title is too long!'),
    content: z
      .string()
      .trim()
      .min(1, 'Post body is required')
      .max(3000, 'Your post is too long!'),
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!postData) {
      // Creating a new post
      createPostMutation.mutate(
        {
          title: values.title,
          content: values.content,
          eventId,
        },
        {
          onSuccess: ([error, _post]) => {
            if (error) {
              toast.error('Failed to create post', {
                description: 'The post could not be created. Please try again.',
              });
              return;
            }

            toast.success('Your post has been successfully created.');
            router.push(`/event/${eventId}`);
          },
          onError: () => {
            toast.error('Failed to create post', {
              description: 'An unexpected error occurred. Please try again.',
            });
          },
        }
      );
    } else {
      // Updating an existing post
      updatePostMutation.mutate(
        {
          id: postData.id,
          title: values.title,
          content: values.content,
        },
        {
          onSuccess: ([error, _post]) => {
            if (error) {
              toast.error('Failed to update post', {
                description: 'The post could not be updated. Please try again.',
              });
              return;
            }

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

  // Check if any mutation is pending
  const isSaving = createPostMutation.isLoading || updatePostMutation.isLoading;

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
                <Link href={backUrl}>
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
