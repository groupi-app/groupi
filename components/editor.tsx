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
import { useToast } from '@/components/ui/use-toast';
import { createPost, updatePost } from '@/lib/actions/post';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Tiptap } from './tiptap';
import { Button } from './ui/button';

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
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [titleEdited, setTitleEdited] = useState<boolean>(false);
  const [contentEdited, setContentEdited] = useState<boolean>(false);
  const { toast } = useToast();
  const backUrl = postData ? `/post/${postData.id}` : `/event/${eventId}`;
  const title = postData?.title || '';
  const content = postData?.content || '';

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
    setIsSaving(true);

    if (!postData) {
      const res = await createPost({
        title: values.title,
        content: values.content,
        eventId,
      });
      if (res.success) {
        toast({
          title: 'Post Created',
          description: 'Your post has been successfully created.',
        });
      }
      setIsSaving(false);
      router.push(`/event/${eventId}`);
    } else {
      const res = await updatePost({
        id: postData.id,
        title: values.title,
        content: values.content,
      });
      if (res.success) {
        toast({
          title: 'Post Edited',
          description: 'Your post has been successfully edited.',
        });
      }
      setIsSaving(false);
      router.push(`/post/${postData.id}`);
    }
  }

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
                      placeholder='Type your post here.'
                      content={field.value}
                      onChange={field.onChange}
                      onChangeCapture={contentEditedOnChange}
                    />
                  </FormControl>
                  <FormMessage data-test='post-editor-content-error' />
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

            {postData ? (
              <Button
                className='w-full md:w-max flex items-center gap-1'
                type='submit'
                disabled={isSaving}
              >
                {isSaving ? (
                  <Icons.spinner className='h-4 w-4 animate-spin' />
                ) : (
                  <Icons.save className='size-4' />
                )}
                <span>Save</span>{' '}
              </Button>
            ) : (
              <Button
                data-test='post-editor-submit'
                className='w-full md:w-max flex items-center gap-1'
                type='submit'
                disabled={isSaving}
              >
                {isSaving ? (
                  <Icons.spinner className='h-4 w-4 animate-spin' />
                ) : (
                  <Icons.submit className='size-4' />
                )}
                <span>Submit</span>
              </Button>
            )}
          </form>
        </Form>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard Changes?</DialogTitle>
            <DialogDescription>
              Are you sure you want to exit the editor? Any changes you&apos;ve
              made will not be saved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className='flex items-center gap-2'>
              <DialogClose className='grow' asChild>
                <Button variant='ghost'>Cancel</Button>
              </DialogClose>
              <Link className='grow' href={backUrl}>
                <Button className='w-full' variant='destructive'>
                  Discard
                </Button>
              </Link>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
