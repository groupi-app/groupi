'use client';

// State variable used only for its setter to trigger re-renders

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
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from 'convex/react';
import { toast } from 'sonner';
import { useCreatePost, useUpdatePost } from '@/hooks/convex/use-posts';
import { useEventMembers } from '@/hooks/convex/use-events';
import { useAttachments, UploadResult } from '@/hooks/convex/use-file-upload';
import { AttachmentButton, AttachmentPreview } from '@/components/attachments';
import * as z from 'zod';
import { BlockNoteEditor } from './blocknote-editor';
import { Button } from '@/components/ui/button';
import { componentLogger } from '@/lib/logger';
import { Id } from '@/convex/_generated/dataModel';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let attachmentMutations: any;

function initAttachmentApi() {
  if (!attachmentMutations) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    attachmentMutations = api.attachments?.mutations ?? {};
  }
}
initAttachmentApi();

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
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Reset key for TipTap - incremented to force content sync
  const [, setEditorResetKey] = useState(0);

  const backUrl = postData
    ? `/event/${eventId}/post/${postData.id}`
    : `/event/${eventId}`;
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
  const updatePost = useUpdatePost(eventId as Id<'events'>);
  const createAttachmentsBatch = useMutation(
    attachmentMutations.createAttachmentsBatch
  );

  // Fetch members for @mention functionality
  const attendeesData = useEventMembers(eventId as Id<'events'>);
  const members = attendeesData?.event?.memberships || [];

  // Attachment handling
  const {
    pendingUploads,
    addFiles,
    removeFile,
    updateFile,
    toggleSpoiler,
    uploadAll,
    clearAll,
    isUploading,
    canAddMore,
    remainingSlots,
  } = useAttachments();

  // Handle file selection from attachment button
  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      const result = await addFiles(files);
      if (result.errors.length > 0) {
        toast.error('Some files could not be added', {
          description: result.errors[0],
        });
      }
    },
    [addFiles]
  );

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
    // Clear any pending attachments
    clearAll();
  }, [form, title, content, clearAll]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    try {
      // Upload any pending attachments first
      let uploadedAttachments: UploadResult[] = [];
      if (pendingUploads.length > 0) {
        uploadedAttachments = await uploadAll();
        if (uploadedAttachments.length === 0 && pendingUploads.length > 0) {
          toast.error('Failed to upload attachments', {
            description: 'Please try again.',
          });
          setIsSaving(false);
          return;
        }
      }

      if (!postData) {
        // Create new post
        const result = await createPost({
          eventId: eventId as Id<'events'>,
          title: values.title,
          content: values.content,
        });

        // If we have attachments, create the attachment records
        if (uploadedAttachments.length > 0 && result?.postId) {
          await createAttachmentsBatch({
            attachments: uploadedAttachments.map(a => ({
              storageId: a.storageId,
              filename: a.filename,
              size: a.size,
              mimeType: a.mimeType,
              width: a.width,
              height: a.height,
              isSpoiler: a.isSpoiler,
              altText: a.altText,
            })),
            postId: result.postId,
          });
        }

        // Clear form before navigating away
        resetFormState();
        router.push(`/event/${eventId}`);
        // Success toast handled by the hook
      } else {
        // Update existing post
        await updatePost({
          postId: postData.id as Id<'posts'>,
          title: values.title,
          content: values.content,
        });

        // If we have new attachments, create the attachment records
        if (uploadedAttachments.length > 0) {
          await createAttachmentsBatch({
            attachments: uploadedAttachments.map(a => ({
              storageId: a.storageId,
              filename: a.filename,
              size: a.size,
              mimeType: a.mimeType,
              width: a.width,
              height: a.height,
              isSpoiler: a.isSpoiler,
              altText: a.altText,
            })),
            postId: postData.id as Id<'posts'>,
          });
        }

        // Clear form before navigating away
        resetFormState();
        router.push(`/event/${eventId}/post/${postData.id}`);
        // Success toast handled by the hook
      }
    } catch (error) {
      componentLogger.error('Editor', 'Failed to save post', {
        error,
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        eventId,
        postId: postData?.id,
      });
      // Error toast handled by the hook
    } finally {
      setIsSaving(false);
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
                    <BlockNoteEditor
                      data-test='post-editor-body'
                      placeholder='Type your post here.'
                      content={field.value}
                      onChange={field.onChange}
                      onChangeCapture={contentEditedOnChange}
                      eventId={eventId as Id<'events'>}
                      members={members}
                      className='min-h-[300px]'
                    />
                  </FormControl>
                  <FormMessage data-test='post-editor-body-error' />
                </FormItem>
              )}
            />

            {/* Attachments Section */}
            <div className='space-y-3'>
              <AttachmentButton
                onFilesSelected={handleFilesSelected}
                disabled={!canAddMore || isSaving || isUploading}
                remainingSlots={remainingSlots}
                label='Add images, videos, or files'
              />
              {pendingUploads.length > 0 && (
                <AttachmentPreview
                  uploads={pendingUploads}
                  onRemove={removeFile}
                  onToggleSpoiler={toggleSpoiler}
                  onUpdate={updateFile}
                />
              )}
            </div>

            {contentEdited && postData && (
              <span
                data-test='post-editor-content-edited'
                className='text-sm text-muted-foreground -mt-2'
              >
                Edited
              </span>
            )}

            <div className='flex items-center gap-2 mb-8'>
              <Button
                data-test='post-editor-submit'
                type='submit'
                className='w-full md:w-auto'
                isLoading={isSaving}
                loadingText={postData ? 'Updating...' : 'Creating...'}
              >
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
