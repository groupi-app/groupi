'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
// Type casts needed for:
// - ID compatibility between legacy string id and Convex Id types
// - Membership data transformations between query results and component props

import { useUpdateReply } from '@/hooks/convex/use-replies';
import { formatReplyDate, getInitialsFromName } from '@/lib/utils';
import { canDeleteReply } from '@/lib/event-permissions';
import { zodResolver } from '@hookform/resolvers/zod';
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMobile } from '@/hooks/use-mobile';
import { useMutation } from 'convex/react';
import { toast } from 'sonner';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { User } from '@/convex/types';
import { DeleteReplyDialog } from './deleteReplyDialog';
import { Icons } from '@/components/icons';
import { AttachmentGallery } from '@/components/attachments';
import { useMergedAttachments } from '@/contexts/pending-attachments-context';
import MemberIcon from '@/components/member-icon';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { BlockNoteInline, BlockNoteInlineHandle } from './blocknote-inline';
import { MentionHandler } from './mention-handler';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  reply: z
    .string()
    .min(1, 'Reply must be at least 1 character')
    .max(5000, 'Reply must be 5000 characters or less'),
});

// Strip leading and trailing empty paragraph tags that BlockNote adds
const stripEmptyParagraphs = (html: string): string => {
  return html
    .replace(/^(<p>(\s|&nbsp;)*<\/p>)+/gi, '') // Remove leading empty paragraphs
    .replace(/(<p>(\s|&nbsp;)*<\/p>)+$/gi, '') // Remove trailing empty paragraphs
    .trim();
};

// Helper function to migrate plaintext to HTML
// Wraps plaintext in <p> tags (equivalent to typing plaintext into tiptap)
const migratePlaintextToHtml = (text: string): string => {
  // If it already looks like HTML (contains tags), strip empty paragraphs and return
  if (/<[^>]+>/.test(text)) {
    return stripEmptyParagraphs(text);
  }
  // Otherwise, wrap in <p> tag and escape HTML
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<p>${escaped}</p>`;
};

function ClickableAvatar({
  author,
  isMe,
}: {
  author: Doc<'persons'> & {
    user: User;
  };
  isMe: boolean;
}) {
  if (!author) return null;

  const user = author.user;
  const fullName = user?.name || user?.email || '';
  const initials = getInitialsFromName(
    user?.name ?? undefined,
    user?.email ?? undefined
  );

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger className='rounded-full'>
            <Avatar className='size-10 border-2 border-background hover:border-primary transition-colors'>
              <AvatarImage src={user?.image || undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <DropdownMenuContent align={isMe ? 'end' : 'start'}>
          <DropdownMenuLabel>
            <div className='flex flex-col'>
              <span className='text-base text-card-foreground'>{fullName}</span>
              <span className='text-muted-foreground'>{user?.email}</span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuContent>
        <TooltipContent>
          <span>{fullName}</span>
        </TooltipContent>
      </Tooltip>
    </DropdownMenu>
  );
}

function ReplyActionMenu({
  children,
  isMobile,
  sheetOpen,
  editMode,
  setSheetOpen,
  handleContextMenu,
  handleClick,
  isMe,
  canDelete,
  setEditMode,
  setDeleteDialogOpen,
}: {
  children: React.ReactNode;
  isMobile: boolean;
  sheetOpen: boolean;
  editMode: boolean;
  setSheetOpen: (open: boolean) => void;
  handleContextMenu: (e: React.MouseEvent | React.TouchEvent) => void;
  handleClick: (e: React.MouseEvent) => void;
  isMe: boolean;
  canDelete: boolean;
  setEditMode: (edit: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
}) {
  if (isMobile) {
    return (
      <Drawer
        open={sheetOpen && !editMode}
        onOpenChange={open => {
          // Prevent opening if in edit mode
          if (editMode) {
            if (!open) {
              setSheetOpen(false);
            }
            return;
          }
          // On mobile, prevent opening via onOpenChange - only allow via contextmenu handler
          if (isMobile && open && !sheetOpen) {
            // Prevent opening - drawer should only open via contextmenu handler
            return;
          }
          // Allow closing
          if (!open) {
            setSheetOpen(false);
          }
        }}
        modal={true}
      >
        <div
          onContextMenu={handleContextMenu}
          onClick={handleClick}
          style={{ touchAction: 'manipulation' }}
        >
          {children}
        </div>
        <DrawerContent>
          <VisuallyHidden>
            <DrawerTitle>Reply Options</DrawerTitle>
          </VisuallyHidden>
          <div className='flex flex-col gap-2 px-4 pb-4 pt-4'>
            {isMe && (
              <Button
                variant='ghost'
                className='w-full justify-start'
                onClick={() => {
                  setEditMode(true);
                  setSheetOpen(false);
                }}
              >
                <Icons.edit className='size-4 mr-2' />
                Edit
              </Button>
            )}
            <Button
              variant='ghost'
              className='w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10'
              onClick={() => {
                setSheetOpen(false);
                setDeleteDialogOpen(true);
              }}
            >
              <Icons.delete className='size-4 mr-2' />
              Delete
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <ContextMenu>
      {children}
      {canDelete && !editMode && (
        <ContextMenuContent>
          {isMe && (
            <ContextMenuItem
              onClick={() => setEditMode(true)}
              className='cursor-pointer'
            >
              <div className='flex items-center gap-1'>
                <Icons.edit className='size-4' />
                <span>Edit</span>
              </div>
            </ContextMenuItem>
          )}
          <ContextMenuItem
            onSelect={e => {
              e.preventDefault();
              setDeleteDialogOpen(true);
            }}
            className='cursor-pointer focus:bg-destructive focus:text-destructive-foreground'
          >
            <div className='flex items-center gap-1'>
              <Icons.delete className='size-4' />
              <span>Delete</span>
            </div>
          </ContextMenuItem>
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
}

export default function ReplyComponent({
  reply,
  member,
  userId,
  userRole,
  eventDateTime,
  postId,
  post,
  isEditing: externalEditMode,
  onClearEditing,
}: {
  reply: {
    id: string; // Legacy id for compatibility
    _id?: string; // Convex ID
    text: string;
    createdAt: Date;
    updatedAt: Date;
    author: Doc<'persons'> & {
      user: User;
    };
    attachments?: Array<{
      _id: string;
      type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';
      filename: string;
      size: number;
      mimeType: string;
      width?: number;
      height?: number;
      url: string | null;
    }>;
  };
  member:
    | undefined
    | (Doc<'memberships'> & {
        person: Doc<'persons'> & {
          user: User;
        };
      });
  userId: string;
  userRole: string;
  eventDateTime: Date | null;
  postId: string;
  post?: Doc<'posts'> & {
    event: Doc<'events'> & {
      memberships: Array<
        Doc<'memberships'> & {
          person: Doc<'persons'> & {
            user: User;
          };
        }
      >;
    };
  };
  isEditing?: boolean;
  onClearEditing?: () => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deletingAttachmentIds, setDeletingAttachmentIds] = useState<
    Set<string>
  >(new Set());
  const isMobile = useMobile();
  const updateReply = useUpdateReply(postId as Id<'posts'>);
  const deleteAttachment = useMutation(attachmentMutations.deleteAttachment);
  const editorRef = useRef<BlockNoteInlineHandle>(null);

  // Merge pending attachments with real attachments for optimistic rendering
  // This keeps preview images visible until real attachment URLs are available
  console.log(
    '[Reply] reply._id:',
    reply._id,
    'reply.attachments:',
    reply.attachments
  );
  const mergedAttachments = useMergedAttachments(
    reply._id || reply.id,
    reply.attachments
  );
  console.log('[Reply] mergedAttachments:', mergedAttachments);

  // Filter out attachments that are being deleted (optimistic deletion)
  const visibleAttachments = useMemo(
    () => mergedAttachments.filter(a => !deletingAttachmentIds.has(a._id)),
    [mergedAttachments, deletingAttachmentIds]
  );

  // Migrate plaintext to HTML if needed
  const replyContent = migratePlaintextToHtml(reply.text);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      reply: replyContent,
    },
  });
  const isMe = reply.author ? userId === reply.author._id : false;
  const canDelete = reply.author
    ? canDeleteReply({
        userId,
        userRole: userRole as 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE',
        replyAuthorId: reply.author._id,
      })
    : false;

  // Close drawer when entering edit mode
  useEffect(() => {
    if (editMode && sheetOpen) {
      // Use setTimeout to avoid synchronous setState in effect
      const timer = setTimeout(() => {
        setSheetOpen(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [editMode, sheetOpen]);

  // Focus editor when entering edit mode
  useEffect(() => {
    if (editMode) {
      // Small delay to ensure editor is mounted and ready
      const timer = setTimeout(() => {
        editorRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editMode]);

  // Sync with external edit mode (from up arrow in reply form)
  useEffect(() => {
    if (externalEditMode && !editMode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with external edit mode prop
      setEditMode(true);
    }
  }, [externalEditMode, editMode]);

  // Notify parent when exiting edit mode
  const handleExitEditMode = useCallback(() => {
    setEditMode(false);
    form.reset({ reply: replyContent });
    onClearEditing?.();
  }, [form, replyContent, onClearEditing]);

  // Handle context menu (right-click or long-press) on mobile
  const handleContextMenu = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isMobile || !canDelete || editMode) return;

      e.preventDefault();
      e.stopPropagation();
      setSheetOpen(true);
    },
    [isMobile, canDelete, editMode]
  );

  // Prevent regular clicks from opening drawer
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // On mobile, prevent clicks from doing anything - only context menu should open drawer
      if (isMobile) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [isMobile]
  );

  // Handle attachment deletion (optimistic)
  const handleDeleteAttachment = useCallback(
    async (attachmentId: string) => {
      // Optimistically remove from UI immediately
      setDeletingAttachmentIds(prev => new Set(prev).add(attachmentId));

      try {
        await deleteAttachment({
          attachmentId: attachmentId as Id<'attachments'>,
        });
        // Success - attachment is now deleted on server, Convex will update the cache
      } catch {
        // Failed - restore the attachment in the UI
        setDeletingAttachmentIds(prev => {
          const next = new Set(prev);
          next.delete(attachmentId);
          return next;
        });
        toast.error('Failed to remove attachment');
      }
    },
    [deleteAttachment]
  );

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Close edit mode immediately for instant UI feedback
      setEditMode(false);
      form.reset({ reply: values.reply });
      onClearEditing?.();

      // Use Convex mutation - real-time updates handled automatically
      await updateReply({
        replyId: (reply._id || reply.id) as any,
        text: values.reply,
      });

      // Success - Convex handles real-time updates automatically
    } catch {
      // Re-open edit mode so user can try again
      setEditMode(true);
      form.reset({ reply: replyContent });
      // Error toast is handled by the updateReply hook
    }
  }

  const name =
    member?.person.user.name ??
    reply.author?.user?.name ??
    reply.author?.user?.email?.split('@')[0] ??
    'Unknown';

  // Common reply content
  const replyContentElement = (
    <div className='flex items-start gap-3 py-3 hover:bg-muted/50 px-2 sm:px-2 sm:-mx-2 rounded-md transition-colors group relative'>
      {member ? (
        <MemberIcon
          itemKey={member._id}
          userId={userId}
          userRole={userRole}
          member={member}
          eventDateTime={eventDateTime}
          align='start'
        />
      ) : (
        <ClickableAvatar author={reply.author} isMe={isMe} />
      )}

      <div className='flex-1 min-w-0'>
        <div className='flex items-baseline gap-2 mb-1'>
          <span className='text-sm font-medium'>{name}</span>
          <span className='text-xs text-muted-foreground'>
            {formatReplyDate(reply.createdAt)}
            {reply.updatedAt &&
              reply.updatedAt.getTime() !== reply.createdAt.getTime() &&
              ' (edited)'}
          </span>
        </div>

        {editMode ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name='reply'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormControl>
                      <div className='relative'>
                        <BlockNoteInline
                          ref={editorRef}
                          placeholder='Edit reply...'
                          content={field.value}
                          onChange={field.onChange}
                          eventId={post?.event?._id}
                          members={post?.event?.memberships as any}
                          isMobile={isMobile}
                          onKeyDown={e => {
                            if (e.key === 'Escape') {
                              e.preventDefault();
                              handleExitEditMode();
                            } else if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              form.handleSubmit(onSubmit)();
                            }
                          }}
                        />
                        <div className='flex items-center gap-1 mt-2 text-xs text-muted-foreground'>
                          <span className='leading-none'>Escape to</span>
                          <Button
                            type='button'
                            variant='link'
                            className='h-auto p-0 m-0 leading-none !text-xs !text-primary hover:!text-primary/80'
                            onClick={handleExitEditMode}
                          >
                            cancel
                          </Button>
                          <span className='leading-none'>•</span>
                          <span className='leading-none'>Enter to</span>
                          <Button
                            variant='link'
                            className='h-auto p-0 m-0 leading-none !text-xs !text-primary hover:!text-primary/80'
                            onClick={() => form.handleSubmit(onSubmit)()}
                          >
                            save
                          </Button>
                        </div>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        ) : (
          <div className='space-y-2'>
            <MentionHandler
              members={post?.event?.memberships || []}
              userId={userId}
              userRole={userRole}
              eventDateTime={eventDateTime}
            >
              <div
                className='prose prose-sm max-w-none text-foreground'
                dangerouslySetInnerHTML={{ __html: replyContent }}
              />
            </MentionHandler>
            {/* Display attachments (merged with pending for optimistic rendering) */}
            {visibleAttachments.length > 0 && (
              <AttachmentGallery
                attachments={visibleAttachments}
                onDelete={isMe ? handleDeleteAttachment : undefined}
              />
            )}
          </div>
        )}
      </div>

      {canDelete && !editMode && (
        <DropdownMenu>
          <DropdownMenuTrigger className='absolute z-float size-8 transition-all rounded-md hover:bg-muted top-2 right-2 flex items-center justify-center opacity-0 group-hover:opacity-100'>
            <Icons.more />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {isMe && (
              <DropdownMenuItem
                onClick={() => setEditMode(true)}
                className='cursor-pointer'
              >
                <div className='flex items-center gap-1'>
                  <Icons.edit className='size-4' />
                  <span>Edit</span>
                </div>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              onClick={() => setDeleteDialogOpen(true)}
              className='cursor-pointer focus:bg-destructive focus:text-destructive-foreground'
            >
              <div className='flex items-center gap-1'>
                <Icons.delete className='size-4' />
                <span>Delete</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );

  return (
    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <ReplyActionMenu
        isMobile={isMobile}
        sheetOpen={sheetOpen}
        editMode={editMode}
        setSheetOpen={setSheetOpen}
        handleContextMenu={handleContextMenu}
        handleClick={handleClick}
        isMe={isMe}
        canDelete={canDelete}
        setEditMode={setEditMode}
        setDeleteDialogOpen={setDeleteDialogOpen}
      >
        {isMobile ? (
          <div onContextMenu={handleContextMenu}>{replyContentElement}</div>
        ) : (
          <ContextMenuTrigger asChild>{replyContentElement}</ContextMenuTrigger>
        )}
      </ReplyActionMenu>
      <DeleteReplyDialog
        id={(reply._id || reply.id) as Id<'replies'>}
        postId={postId as Id<'posts'>}
      />
    </Dialog>
  );
}
