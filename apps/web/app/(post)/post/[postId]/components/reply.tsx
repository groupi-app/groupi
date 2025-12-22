'use client';

import { updateReplyAction } from '@/actions/reply-actions';
import { formatReplyDate } from '@/lib/utils';
import { canDeleteReply } from '@/lib/event-permissions';
import { Member } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  RoleType,
  type PostDetailData,
  type PostDetailPageData,
} from '@groupi/schema';
import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import { useMobile } from '@/hooks/use-mobile';
import { DeleteReplyDialog } from './deleteReplyDialog';
import { Icons } from '@/components/icons';
import MemberIcon from '@/components/member-icon';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
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
import { TiptapInline } from './tiptap-inline';
import { MentionHandler } from './mention-handler';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitialsFromName } from '@/lib/utils';
import { toast } from 'sonner';

const formSchema = z.object({
  reply: z
    .string()
    .min(1, 'Reply must be at least 1 character')
    .max(5000, 'Reply must be 5000 characters or less'),
});

// Helper function to migrate plaintext to HTML
// Wraps plaintext in <p> tags (equivalent to typing plaintext into tiptap)
const migratePlaintextToHtml = (text: string): string => {
  // If it already looks like HTML (contains tags), return as-is
  if (/<[^>]+>/.test(text)) {
    return text;
  }
  // Otherwise, wrap in <p> tag and escape HTML
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<p>${escaped}</p>`;
};

interface ClickableAvatarProps {
  author: PostDetailData['replies'][0]['author'];
  isMe: boolean;
}

function ClickableAvatar({ author, isMe }: ClickableAvatarProps) {
  if (!author) return null;

  const user = author.user;
  const fullName = user?.name || user?.email || '';
  const initials = getInitialsFromName(user?.name, user?.email);

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

interface ReplyActionMenuProps {
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
}: ReplyActionMenuProps) {
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
}: {
  reply: PostDetailData['replies'][0];
  member: Member | undefined;
  userId: string;
  userRole: RoleType;
  eventDateTime: Date | null;
  postId: string;
  post: PostDetailData;
}) {
  const [editMode, setEditMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const isMobile = useMobile();
  const queryClient = useQueryClient();

  // Migrate plaintext to HTML if needed
  const replyContent = migratePlaintextToHtml(reply.text);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      reply: replyContent,
    },
  });
  const isMe = reply.author ? userId === reply.author.id : false;
  const canDelete = reply.author
    ? canDeleteReply({
        userId,
        userRole,
        replyAuthorId: reply.author.id,
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Save previous data for rollback
    const prev = queryClient.getQueryData(qk.posts.detail(postId));

    // Optimistically update the reply in React Query cache immediately
    queryClient.setQueryData<PostDetailPageData>(
      qk.posts.detail(postId),
      old => {
        if (!old) return old;
        return {
          ...old,
          post: {
            ...old.post,
            replies: old.post.replies.map(r =>
              r.id === reply.id
                ? { ...r, text: values.reply, updatedAt: new Date() }
                : r
            ),
          },
        };
      }
    );

    // Close edit mode immediately for instant UI feedback
    setEditMode(false);
    form.reset({ reply: values.reply });

    // Handle server update in the background
    const [error] = await updateReplyAction({
      replyId: reply.id,
      text: values.reply,
    });

    if (error) {
      // Rollback optimistic update on error
      if (prev) {
        queryClient.setQueryData(qk.posts.detail(postId), prev);
      } else {
        queryClient.invalidateQueries({ queryKey: qk.posts.detail(postId) });
      }
      toast.error('Failed to update reply', {
        description: 'The reply could not be updated. Please try again.',
      });
      // Re-open edit mode so user can try again
      setEditMode(true);
    } else {
      // Success - Pusher will handle the real-time update
      // No need to show toast or invalidate, optimistic update already shown the change
    }
  }

  const name =
    member?.person.user.name ??
    reply.author?.user?.name ??
    reply.author?.user?.email.split('@')[0] ??
    'Unknown';

  // Common reply content
  const replyContentElement = (
    <div className='flex items-start gap-3 py-4 hover:bg-muted/50 px-2 sm:px-2 sm:-mx-2 rounded-md transition-colors group relative'>
      {member ? (
        <MemberIcon
          itemKey={member.id}
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
                        <TiptapInline
                          placeholder='Edit reply...'
                          content={field.value}
                          onChange={field.onChange}
                          eventId={post.event.id}
                          members={post.event.memberships}
                          isMobile={isMobile}
                          onKeyDown={e => {
                            if (e.key === 'Escape') {
                              e.preventDefault();
                              setEditMode(false);
                              form.reset({ reply: replyContent });
                            } else if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (form.formState.isValid) {
                                form.handleSubmit(onSubmit)();
                              }
                            }
                          }}
                        />
                        <div className='flex items-center gap-1 mt-2 text-xs text-muted-foreground'>
                          <span className='leading-none'>Escape to</span>
                          <Button
                            variant='link'
                            className='h-auto p-0 m-0 leading-none !text-xs !text-primary hover:!text-primary/80'
                            onClick={() => {
                              setEditMode(false);
                              form.reset({ reply: replyContent });
                            }}
                          >
                            cancel
                          </Button>
                          <span className='leading-none'>•</span>
                          <span className='leading-none'>Enter to</span>
                          <Button
                            variant='link'
                            className='h-auto p-0 m-0 leading-none !text-xs !text-primary hover:!text-primary/80'
                            type='submit'
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
          <MentionHandler
            members={post.event.memberships}
            userId={userId}
            userRole={userRole}
            eventDateTime={eventDateTime}
          >
            <div
              className='prose prose-sm max-w-none text-foreground'
              dangerouslySetInnerHTML={{ __html: replyContent }}
            />
          </MentionHandler>
        )}
      </div>

      {canDelete && !editMode && (
        <>
          <DropdownMenuTrigger className='absolute z-20 size-8 transition-all rounded-md hover:bg-muted top-2 right-2 flex items-center justify-center opacity-0 group-hover:opacity-100'>
            <Icons.more />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {isMe && (
              <DropdownMenuItem
                onClick={() => setEditMode(true)}
                className='cursor-pointer'
                asChild
              >
                <div className='flex items-center gap-1'>
                  <Icons.edit className='size-4' />
                  <span>Edit</span>
                </div>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              asChild
              className='cursor-pointer focus:bg-destructive focus:text-destructive-foreground'
            >
              <DialogTrigger asChild>
                <div className='flex items-center gap-1'>
                  <Icons.delete className='size-4' />
                  <span>Delete</span>
                </div>
              </DialogTrigger>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </>
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
        <DropdownMenu>
          {isMobile ? (
            <div onContextMenu={handleContextMenu}>{replyContentElement}</div>
          ) : (
            <ContextMenuTrigger asChild>
              {replyContentElement}
            </ContextMenuTrigger>
          )}
        </DropdownMenu>
      </ReplyActionMenu>
      <DeleteReplyDialog id={reply.id} />
    </Dialog>
  );
}
