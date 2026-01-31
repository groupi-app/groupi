'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { cn, timeUntil } from '@/lib/utils';
import {
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@radix-ui/react-dialog';
import { useState } from 'react';
import QRCode from 'react-qr-code';
import { Checkbox } from '@/components/ui/checkbox';
import { getInviteUrl } from '@/lib/urls';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useDeleteInvites } from '@/hooks/convex/use-invites';
import { Doc, Id } from '@/convex/_generated/dataModel';

export function InviteLinkCard({
  invite,
  selectedInvites,
  setSelectedInvites,
}: {
  invite: Doc<'invites'>;
  selectedInvites: Id<'invites'>[];
  setSelectedInvites: (invites: Id<'invites'>[]) => void;
}) {
  const [dialogType, setDialogType] = useState('view');
  const [isOpen, setIsOpen] = useState(false);
  const deleteInvites = useDeleteInvites(invite.eventId);

  const {
    _id: id,
    name,
    usesRemaining,
    maxUses,
    expiresAt,
    _creationTime: createdAt,
    token,
  } = invite;

  // Check if this is an optimistic (pending) invite
  const isPending = token.startsWith('pending_');

  // Generate invite URL using the token (not the document ID)
  // For pending invites, use a placeholder
  const inviteUrl = isPending
    ? 'Generating invite link...'
    : getInviteUrl(token);

  const handleDeleteInvite = async () => {
    try {
      await deleteInvites([id]);
      toast.success('The invite has been successfully deleted.');
      // Dialog will close automatically when component unmounts
    } catch {
      // Keep dialog open on error so user can try again
      toast.error('Failed to delete invite', {
        description: 'The invite could not be deleted. Please try again.',
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset dialog type when closing
      setDialogType('view');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <div className='relative max-w-3xl'>
        <Checkbox
          checked={selectedInvites.includes(id)}
          onCheckedChange={() => {
            if (!selectedInvites.includes(id)) {
              setSelectedInvites([...selectedInvites, id]);
            } else {
              setSelectedInvites(
                selectedInvites.filter(selected => selected !== id)
              );
            }
          }}
          className='size-6 z-float absolute left-4 top-4 md:top-0 md:bottom-0 my-auto hover:bg-primary transition-all'
        />
        <DialogTrigger
          onClick={() => {
            setDialogType('view');
            setIsOpen(true);
          }}
          asChild
        >
          <div
            className={cn(
              'cursor-pointer border border-border shadow-floating rounded-lg py-3 px-6 hover:bg-accent/80 transition-all z-lifted overflow-hidden',
              selectedInvites.includes(id) ? 'bg-primary/30' : 'bg-card'
            )}
          >
            <div className='flex items-center md:pl-8'>
              <div className='flex md:items-center gap-2 md:gap-8 flex-col md:flex-row w-full'>
                <div className='pl-8 md:pl-0 pr-8 md:pr-0 md:w-2/5'>
                  <h1 className='text-2xl overflow-hidden text-ellipsis whitespace-nowrap'>
                    {name
                      ? name
                      : isPending
                        ? 'Creating invite...'
                        : `/invite/...${token.substring(token.length - 4)}`}
                  </h1>
                  <span className='text-sm text-muted-foreground'>
                    {isPending ? (
                      <span className='flex items-center gap-1'>
                        <Icons.spinner className='size-3 animate-spin' />
                        Generating link...
                      </span>
                    ) : (
                      <>
                        Created:{' '}
                        {new Date(createdAt).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </>
                    )}
                  </span>
                </div>
                <div className='flex items-center gap-4 md:gap-8 px-3'>
                  <div className='flex items-center gap-1'>
                    <Icons.time className='size-8 text-muted-foreground' />
                    <span className='md:text-lg'>
                      {expiresAt ? timeUntil(new Date(expiresAt)) : 'Never'}
                    </span>
                  </div>
                  {/* Uses left */}
                  <div className='flex items-center gap-1'>
                    <Icons.account className='size-8 text-muted-foreground' />
                    <span className='md:text-lg'>
                      {maxUses ? (
                        <span>
                          {usesRemaining ?? maxUses}/{maxUses}
                        </span>
                      ) : (
                        <span>Unlimited</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogTrigger>
        <DialogTrigger asChild>
          <Button
            className='hover:bg-destructive hover:text-destructive-foreground z-float absolute right-4 top-3 md:top-0 md:bottom-0 my-auto'
            onClick={() => {
              setDialogType('delete');
              setIsOpen(true);
            }}
            variant='outline'
            size='icon'
          >
            <Icons.delete className='size-5' />
          </Button>
        </DialogTrigger>
      </div>

      <DialogContent
        onInteractOutside={e => {
          // Prevent closing when clicking outside during delete
          if (dialogType === 'delete') {
            e.preventDefault();
          }
        }}
      >
        {dialogType === 'view' && (
          <div className='w-full overflow-hidden'>
            <DialogHeader className='w-full'>
              <DialogTitle className='text-2xl break-words'>
                {name ? name : 'Invite'}
              </DialogTitle>
            </DialogHeader>
            <div className='p-4 bg-white w-max rounded-card mx-auto my-4 border border-border shadow-floating'>
              {isPending ? (
                <div className='size-[128px] flex items-center justify-center'>
                  <Icons.spinner className='size-8 animate-spin text-muted-foreground' />
                </div>
              ) : (
                <QRCode size={128} value={inviteUrl} />
              )}
            </div>
            <div className='flex items-center gap-1'>
              <Input value={inviteUrl} readOnly />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(inviteUrl);
                      toast.success('The invite link has been copied.');
                    }}
                    variant='outline'
                    size='icon'
                    disabled={isPending}
                  >
                    <Icons.copy className='size-5' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy Invite Link</TooltipContent>
              </Tooltip>
            </div>
            <div className='py-4'>
              <div className='flex items-center gap-1'>
                <span className='text-muted-foreground'>Created at:</span>
                <span>
                  {new Date(createdAt).toLocaleString([], {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <div className='flex items-center gap-1'>
                <span className='text-muted-foreground'>Expires at:</span>
                <span>
                  {expiresAt
                    ? new Date(expiresAt).toLocaleString([], {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'Never'}
                </span>
              </div>
              <div className='flex items-center gap-1'>
                <span className='text-muted-foreground'>Uses:</span>
                <span>
                  {maxUses ? (
                    <span>
                      {usesRemaining ?? maxUses}/{maxUses} remaining
                    </span>
                  ) : (
                    <span>Unlimited</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
        {dialogType === 'delete' && (
          <>
            <DialogHeader>
              <DialogTitle className='text-2xl'>Delete Invite</DialogTitle>
              <DialogDescription className='text-muted-foreground'>
                Are you sure you want to delete this invite?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <div className='flex gap-4 justify-end'>
                <DialogClose asChild>
                  <Button variant='ghost'>Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button onClick={handleDeleteInvite} variant='destructive'>
                    Delete
                  </Button>
                </DialogClose>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
