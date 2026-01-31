'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Type cast needed for membership data transformation to BlockNoteInline component
// Note: react-hooks/refs disabled because onSubmit accesses refs in event handler context, not during render

import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useForm, ControllerRenderProps } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { useMutation } from 'convex/react';
import { useCreateReply, OptimisticUserData } from '@/hooks/convex/use-replies';
import { useAttachments } from '@/hooks/convex/use-file-upload';
import {
  usePendingAttachments,
  PendingAttachment,
} from '@/contexts/pending-attachments-context';
import { AttachmentButton, AttachmentPreview } from '@/components/attachments';
import { BlockNoteInline, BlockNoteInlineHandle } from './blocknote-inline';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useMobile } from '@/hooks/use-mobile';
import { Id, Doc } from '@/convex/_generated/dataModel';
import { useCurrentUserTypingState } from '@/hooks/convex/use-presence';
import { User } from '@/convex/types';

let attachmentMutations: any;

function initAttachmentApi() {
  if (!attachmentMutations) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    attachmentMutations = api.attachments?.mutations ?? {};
  }
}
initAttachmentApi();

const formSchema = z.object({
  reply: z.string().max(5000, 'Reply must be 5000 characters or less'),
});

// Type for userMembership prop
type UserMembershipProp = Doc<'memberships'> & {
  person: Doc<'persons'> & {
    user: User;
  };
};

export default function ReplyForm({
  postId,
  post,
  userMembership,
  onEditLastReply,
}: {
  postId: Id<'posts'> | string;
  post: {
    event?: {
      _id: Id<'events'>;
      memberships?: Array<{
        _id: Id<'memberships'>;
        person?: {
          _id: Id<'persons'>;
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
  const createAttachmentsBatch = useMutation(
    attachmentMutations.createAttachmentsBatch
  );
  const { setPendingAttachments, clearPendingAttachments } =
    usePendingAttachments();
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

  const formRef = useRef(null);
  const formRefForSubmit = useRef(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<BlockNoteInlineHandle>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isMultiline, setIsMultiline] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useMobile();

  // Track typing state for this post using global user context
  const { setTyping } = useCurrentUserTypingState(postId as Id<'posts'>);

  // Track typing status when editor content changes
  const handleEditorChange = useCallback(
    (value: string) => {
      // Check if there's actual content (not just empty HTML)
      const hasContent = Boolean(
        value &&
          value.trim() !== '' &&
          value !== '<p></p>' &&
          value !== '<p><br></p>'
      );

      // Set typing status based on whether there's content
      setTyping(hasContent);
    },
    [setTyping]
  );

  // Clear typing status on unmount or when form is submitted
  useEffect(() => {
    return () => {
      setTyping(false);
    };
  }, [setTyping]);

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
      const isEmpty =
        !currentValue ||
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
    // Check if there's any content to submit
    const hasText = values.reply && !isEmptyHtml(values.reply);
    const hasAttachments = pendingUploads.length > 0;

    if (!hasText && !hasAttachments) {
      return; // Nothing to submit
    }

    // Clear typing indicator immediately when submitting
    setTyping(false);

    setIsSubmitting(true);

    // Generate a temporary ID for the pending attachments
    // We'll use the real reply ID once we have it
    const tempReplyId = `temp_${Date.now()}`;

    try {
      // Capture upload data BEFORE clearing form (we need it for later operations)
      const capturedUploads = [...pendingUploads];

      // Build pending attachments from uploads BEFORE uploading
      // Store them in context so they persist across Convex data refreshes
      if (hasAttachments) {
        const pendingAttachmentData: PendingAttachment[] = capturedUploads.map(
          (upload, index) => {
            // Determine attachment type from MIME type
            let type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' = 'FILE';
            if (upload.file.type.startsWith('image/')) type = 'IMAGE';
            else if (upload.file.type.startsWith('video/')) type = 'VIDEO';
            else if (upload.file.type.startsWith('audio/')) type = 'AUDIO';

            return {
              _id: `pending_${tempReplyId}_${index}`,
              type,
              filename: upload.displayFilename,
              size: upload.file.size,
              mimeType: upload.file.type,
              width: upload.width,
              height: upload.height,
              isSpoiler: upload.isSpoiler,
              altText: upload.altText,
              url: upload.preview || null,
            };
          }
        );

        // Store pending attachments with temp ID (we'll transfer to real ID after)
        setPendingAttachments(tempReplyId, pendingAttachmentData);
      }

      // Build optimistic attachments for immediate display in Convex optimistic update
      const optimisticAttachments = hasAttachments
        ? capturedUploads.map(upload => ({
            filename: upload.displayFilename,
            size: upload.file.size,
            mimeType: upload.file.type,
            width: upload.width,
            height: upload.height,
            isSpoiler: upload.isSpoiler,
            altText: upload.altText,
            previewUrl: upload.preview,
          }))
        : undefined;

      // Clear form and editor IMMEDIATELY for optimistic UX (before await)
      form.reset();
      editorRef.current?.clear();

      // Create the reply with optimistic attachments
      const result = await createReply({
        text: hasText ? values.reply : '',
        postId: postId as import('@/convex/_generated/dataModel').Id<'posts'>,
        optimisticAttachments,
      });

      // Transfer pending attachments from temp ID to real reply ID
      if (hasAttachments && result?.replyId) {
        const realReplyId = String(result.replyId);

        // Rebuild pending attachments with real reply ID
        const pendingAttachmentData: PendingAttachment[] = capturedUploads.map(
          (upload, index) => {
            let type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' = 'FILE';
            if (upload.file.type.startsWith('image/')) type = 'IMAGE';
            else if (upload.file.type.startsWith('video/')) type = 'VIDEO';
            else if (upload.file.type.startsWith('audio/')) type = 'AUDIO';

            return {
              _id: `pending_${realReplyId}_${index}`,
              type,
              filename: upload.displayFilename,
              size: upload.file.size,
              mimeType: upload.file.type,
              width: upload.width,
              height: upload.height,
              isSpoiler: upload.isSpoiler,
              altText: upload.altText,
              url: upload.preview || null,
            };
          }
        );

        // Store with real reply ID
        setPendingAttachments(realReplyId, pendingAttachmentData);

        // Clear temp ID
        clearPendingAttachments(tempReplyId);

        // Now upload attachments
        const uploadedAttachments = await uploadAll();
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
            replyId: result.replyId,
          });
        }

        // Clear pending attachments - real ones now exist
        clearPendingAttachments(realReplyId);
      }

      // Clear pending uploads
      clearAll();
    } catch {
      // Clear temp pending attachments on error
      clearPendingAttachments(tempReplyId);

      toast.error('Failed to send reply', {
        description: 'The reply could not be sent. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleSubmit = async () => {
    const currentValue = form.getValues('reply');
    const hasText = currentValue && !isEmptyHtml(currentValue);
    const hasAttachments = pendingUploads.length > 0;

    // If there's no content and no attachments, do nothing
    if (!hasText && !hasAttachments) {
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
        'z-float bg-background',
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
                    <div className='space-y-2'>
                      {/* Attachment Preview - hide when submitting */}
                      {pendingUploads.length > 0 && !isSubmitting && (
                        <AttachmentPreview
                          uploads={pendingUploads}
                          onRemove={removeFile}
                          onToggleSpoiler={toggleSpoiler}
                          onUpdate={updateFile}
                          className='px-1'
                        />
                      )}

                      {/* Editor with attachment button */}
                      <div className='flex items-start gap-1'>
                        {/* Attachment Button */}
                        <AttachmentButton
                          onFilesSelected={handleFilesSelected}
                          disabled={!canAddMore || isSubmitting || isUploading}
                          remainingSlots={remainingSlots}
                          className='mt-2 flex-shrink-0'
                        />

                        {/* Editor Container */}
                        <div
                          className='relative flex-1'
                          ref={editorContainerRef}
                        >
                          <BlockNoteInline
                            ref={editorRef}
                            placeholder='Write a reply...'
                            content={field.value}
                            onChange={value => {
                              field.onChange(value);
                              handleEditorChange(value);
                            }}
                            preventEnterSubmit={isMobile}
                            growUpward={isMobile}
                            eventId={post.event?._id}
                            members={(post.event?.memberships as any) || []}
                            isMobile={isMobile}
                            onKeyDown={async e => {
                              // On desktop: Enter sends, Shift+Enter newline
                              // On mobile: Enter always creates newline (handled by preventEnterSubmit)
                              if (
                                !isMobile &&
                                e.key === 'Enter' &&
                                !e.shiftKey
                              ) {
                                e.preventDefault();
                                await handleSubmit();
                              }
                              // Up arrow when field is empty: edit last reply
                              if (e.key === 'ArrowUp' && onEditLastReply) {
                                const currentValue = form.getValues('reply');
                                // Check if field is empty - BlockNote may output empty string or minimal HTML
                                const isEmpty =
                                  !currentValue ||
                                  currentValue.trim() === '' ||
                                  isEmptyHtml(currentValue) ||
                                  currentValue === '<p></p>' ||
                                  currentValue === '<p><br></p>';
                                if (isEmpty && pendingUploads.length === 0) {
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
                            disabled={isSubmitting || isUploading}
                            size='sm'
                            className={cn(
                              'absolute right-2 h-8 w-8 p-0',
                              'bg-primary text-primary-foreground',
                              'hover:bg-primary/90',
                              'shadow-floating',
                              isMultiline || pendingUploads.length > 0
                                ? 'bottom-2'
                                : 'top-1/2 -translate-y-1/2'
                            )}
                            aria-label='Send reply'
                          >
                            {isSubmitting || isUploading ? (
                              <Icons.spinner className='h-4 w-4 animate-spin' />
                            ) : (
                              <Icons.submit className='h-4 w-4' />
                            )}
                          </Button>
                        </div>
                      </div>
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
