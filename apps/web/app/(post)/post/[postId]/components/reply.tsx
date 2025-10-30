'use client';

// Migrated from server actions to tRPC hooks
import { useUpdateReply } from '@groupi/hooks';
import { cn, formatDate } from '@/lib/utils';
import { Member } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { RoleType, type PostDetailDTO } from '@groupi/schema';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { DeleteReplyDialog } from './deleteReplyDialog';
import { Icons } from '@/components/icons';
import MemberIcon from '@/app/(event)/event/[eventId]/components/member-icon';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

const formSchema = z.object({
  reply: z
    .string()
    .min(1, 'Reply must be at least 1 character')
    .max(350, 'Reply must be 350 characters or less'),
});

export default function ReplyComponent({
  reply,
  member,
  userId,
  userRole,
  eventDateTime,
}: {
  reply: PostDetailDTO['replies'][0];
  member: Member | undefined;
  userId: string;
  userRole: RoleType;
  eventDateTime: Date | null;
}) {
  const [editMode, setEditMode] = useState(false);

  // Use our new tRPC hook with integrated real-time sync
  const updateReplyMutation = useUpdateReply();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      reply: reply.text,
    },
  });
  const isMe = userId === reply.author.id;
  const canDelete =
    isMe || userRole === 'MODERATOR' || userRole === 'ORGANIZER';

  async function onSubmit(values: z.infer<typeof formSchema>) {
    updateReplyMutation.mutate(
      {
        replyId: reply.id,
        text: values.reply,
      },
      {
        onSuccess: ([error, _result]) => {
          if (error) {
            toast.error('Failed to update reply', {
              description: 'The reply could not be updated. Please try again.',
            });
            return;
          }

          toast.success('Reply updated', {
            description: 'Your reply has been successfully updated',
          });
          setEditMode(false);
        },
        onError: () => {
          toast.error('Failed to update reply', {
            description: 'An unexpected error occurred. Please try again.',
          });
        },
      }
    );
  }

  const name =
    member?.person.user.name ?? member?.person.user.email.split('@')[0];

  return (
    <Dialog>
      <DropdownMenu>
        <div
          className={cn(
            'flex items-center gap-2',
            isMe ? 'flex-row-reverse -mr-4' : '-ml-4'
          )}
        >
          {member ? (
            <MemberIcon
              itemKey={member.id}
              userId={userId}
              userRole={userRole}
              member={member}
              eventDateTime={eventDateTime}
              align={isMe ? 'end' : 'start'}
            />
          ) : (
            <div className='rounded-full size-10 bg-primary' />
          )}

          <div
            className={cn(
              'rounded-lg max-w-xl px-4 pb-4 min-w-0 break-words relative',
              canDelete ? 'pr-12' : '',
              isMe
                ? 'bg-primary text-primary-foreground pt-4'
                : 'bg-muted text-foreground',
              editMode ? 'w-full' : ''
            )}
          >
            {!isMe && (
              <div className='text-xs text-muted-foreground pt-2'>{name}</div>
            )}
            {canDelete && (
              <>
                <DropdownMenuTrigger
                  className={cn(
                    'absolute z-20 size-8 transition-all rounded-md hover:bg-muted top-3 right-2 flex items-center justify-center',
                    isMe ? 'hover:bg-accent/10' : 'hover:bg-muted-foreground/10'
                  )}
                >
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
            {editMode ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <FormField
                    control={form.control}
                    name='reply'
                    render={({ field }) => (
                      <FormItem className='w-full'>
                        <FormControl>
                          <div className='relative min-h-24'>
                            <Textarea
                              className='bg-background/10 pr-6 my-1 h-[90px] min-h-[90px]'
                              {...field}
                            />
                            <div className='flex flex-col items-center absolute top-1 right-1'>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    className='size-10 p-1'
                                    variant='ghost'
                                    type='submit'
                                    disabled={updateReplyMutation.isLoading}
                                  >
                                    {updateReplyMutation.isLoading ? (
                                      <Icons.spinner className='animate-spin' />
                                    ) : (
                                      <Icons.check />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Save</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    className='size-10 p-1'
                                    variant='ghost'
                                    onClick={() => {
                                      setEditMode(false);
                                      form.reset({ reply: reply.text });
                                    }}
                                  >
                                    <Icons.close />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Cancel</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            ) : (
              <p className='whitespace-pre-wrap'>{reply.text}</p>
            )}

            <div className='text-xs text-primary-foreground/60'>
              {formatDate(reply.createdAt)}
            </div>
          </div>
        </div>
      </DropdownMenu>
      <DeleteReplyDialog id={reply.id} />
    </Dialog>
  );
}
