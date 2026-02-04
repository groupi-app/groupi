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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { componentLogger } from '@/lib/logger';
import { cn } from '@/lib/utils';
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

// Existing attachment from the database (with URL)
interface ExistingAttachment {
  _id: Id<'attachments'>;
  storageId: Id<'_storage'>;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';
  filename: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  isSpoiler?: boolean;
  altText?: string;
  url: string | null;
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
  existingAttachments = [],
}: {
  eventId: string;
  postData?: PostData;
  existingAttachments?: ExistingAttachment[];
}) {
  const [titleEdited, setTitleEdited] = useState<boolean>(false);
  const [contentEdited, setContentEdited] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  // Track existing attachments that have been marked for deletion
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<
    Set<Id<'attachments'>>
  >(new Set());

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
  const deleteAttachment = useMutation(attachmentMutations.deleteAttachment);

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

  // Filter existing attachments to exclude those marked for deletion
  const visibleExistingAttachments = existingAttachments.filter(
    a => !deletedAttachmentIds.has(a._id)
  );

  // Handle removing an existing attachment (marks it for deletion on save)
  const handleRemoveExistingAttachment = useCallback(
    (attachmentId: Id<'attachments'>) => {
      setDeletedAttachmentIds(prev => new Set(prev).add(attachmentId));
    },
    []
  );

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
    // Clear deleted attachments tracking
    setDeletedAttachmentIds(new Set());
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

        // Delete attachments that were marked for removal
        if (deletedAttachmentIds.size > 0) {
          await Promise.all(
            Array.from(deletedAttachmentIds).map(attachmentId =>
              deleteAttachment({ attachmentId })
            )
          );
        }

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
              {/* Existing attachments (when editing) */}
              {visibleExistingAttachments.length > 0 && (
                <ExistingAttachmentPreview
                  attachments={visibleExistingAttachments}
                  onRemove={handleRemoveExistingAttachment}
                />
              )}
              {/* New pending uploads */}
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

/**
 * Component to display existing attachments when editing a post
 * Allows users to remove attachments that will be deleted on save
 */
function ExistingAttachmentPreview({
  attachments,
  onRemove,
}: {
  attachments: ExistingAttachment[];
  onRemove: (id: Id<'attachments'>) => void;
}) {
  // Separate by type for rendering
  const images = attachments.filter(a => a.type === 'IMAGE');
  const videos = attachments.filter(a => a.type === 'VIDEO');
  const audio = attachments.filter(a => a.type === 'AUDIO');
  const files = attachments.filter(a => a.type === 'FILE');

  return (
    <div className='space-y-3'>
      {/* Label for existing attachments */}
      <p className='text-sm text-muted-foreground'>Current attachments:</p>

      {/* Images */}
      {images.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          {images.map(attachment => (
            <div
              key={attachment._id}
              className='relative group rounded-lg overflow-hidden bg-muted size-24'
            >
              {attachment.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={attachment.url}
                  alt={attachment.altText || attachment.filename}
                  className={cn(
                    'w-full h-full object-cover',
                    attachment.isSpoiler && 'blur-xl scale-110'
                  )}
                />
              ) : (
                <div className='w-full h-full flex items-center justify-center'>
                  <Icons.image className='h-6 w-6 text-muted-foreground' />
                </div>
              )}

              {/* Spoiler overlay */}
              {attachment.isSpoiler && (
                <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                  <span className='bg-black/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full'>
                    SPOILER
                  </span>
                </div>
              )}

              {/* Delete button */}
              <div className='absolute top-1 right-1'>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type='button'
                      onClick={() => onRemove(attachment._id)}
                      className={cn(
                        'p-1.5 rounded-md',
                        'bg-black/70 hover:bg-destructive text-white',
                        'transition-colors',
                        'focus:outline-none focus:ring-1 focus:ring-white'
                      )}
                      aria-label={`Remove ${attachment.filename}`}
                    >
                      <Icons.delete className='h-4 w-4' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='bottom'>Remove</TooltipContent>
                </Tooltip>
              </div>

              {/* Filename if different from auto-generated */}
              {attachment.filename && (
                <div className='absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/70 text-white text-xs truncate pointer-events-none'>
                  {attachment.filename}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <div className='space-y-2'>
          {videos.map(attachment => (
            <div
              key={attachment._id}
              className='relative group rounded-md overflow-hidden bg-muted max-w-md'
            >
              {attachment.url ? (
                <video
                  src={attachment.url}
                  controls
                  className='w-full max-h-48'
                  preload='metadata'
                >
                  Your browser does not support video playback.
                </video>
              ) : (
                <div className='flex items-center justify-center h-32 bg-muted'>
                  <Icons.fileVideo className='h-8 w-8 text-muted-foreground' />
                </div>
              )}
              <div className='px-3 py-2 text-sm text-muted-foreground flex items-center gap-2'>
                <Icons.fileVideo className='h-4 w-4' />
                <span className='truncate flex-1'>{attachment.filename}</span>
                <span className='text-xs'>
                  ({formatFileSize(attachment.size)})
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type='button'
                      onClick={() => onRemove(attachment._id)}
                      className='p-1 rounded hover:bg-destructive/80 hover:text-destructive-foreground transition-colors focus:outline-none'
                      aria-label={`Remove ${attachment.filename}`}
                    >
                      <Icons.delete className='h-3.5 w-3.5' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='bottom'>Remove</TooltipContent>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audio */}
      {audio.length > 0 && (
        <div className='space-y-2'>
          {audio.map(attachment => (
            <div
              key={attachment._id}
              className='relative group rounded-md bg-muted p-3 max-w-md'
            >
              <div className='flex items-center gap-2 mb-2 text-sm text-muted-foreground'>
                <Icons.fileAudio className='h-4 w-4' />
                <span className='truncate flex-1'>{attachment.filename}</span>
                <span className='text-xs'>
                  ({formatFileSize(attachment.size)})
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type='button'
                      onClick={() => onRemove(attachment._id)}
                      className='p-1 rounded hover:bg-destructive/80 hover:text-destructive-foreground transition-colors focus:outline-none'
                      aria-label={`Remove ${attachment.filename}`}
                    >
                      <Icons.delete className='h-3.5 w-3.5' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='bottom'>Remove</TooltipContent>
                </Tooltip>
              </div>
              {attachment.url ? (
                <audio src={attachment.url} controls className='w-full'>
                  Your browser does not support audio playback.
                </audio>
              ) : (
                <div className='text-sm text-muted-foreground'>
                  Audio preview unavailable
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Other files */}
      {files.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          {files.map(attachment => (
            <div
              key={attachment._id}
              className={cn(
                'group flex items-center gap-2 px-3 py-2 rounded-md',
                'bg-muted border border-border',
                'text-sm'
              )}
            >
              <Icons.file className='h-4 w-4 text-muted-foreground flex-shrink-0' />
              <span className='max-w-[120px] truncate'>
                {attachment.filename}
              </span>
              <span className='text-xs text-muted-foreground'>
                ({formatFileSize(attachment.size)})
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type='button'
                    onClick={() => onRemove(attachment._id)}
                    className={cn(
                      'p-1 rounded hover:bg-destructive/80 hover:text-destructive-foreground flex-shrink-0',
                      'transition-colors',
                      'focus:outline-none'
                    )}
                    aria-label={`Remove ${attachment.filename}`}
                  >
                    <Icons.delete className='h-3.5 w-3.5' />
                  </button>
                </TooltipTrigger>
                <TooltipContent side='bottom'>Remove</TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
