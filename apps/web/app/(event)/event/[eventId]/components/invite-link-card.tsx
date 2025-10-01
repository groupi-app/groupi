'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Migrated from server actions to tRPC hooks
import { useDeleteInvite } from '@groupi/hooks';
import { cn, getFullName, timeUntil } from '@/lib/utils';
import type { EventInviteDTO } from '@groupi/schema';
// DTO adjusted
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

export function InviteLinkCard({
  invite,
  selectedInvites,
  setSelectedInvites,
}: {
  invite: EventInviteDTO;
  selectedInvites: string[];
  setSelectedInvites: (invites: string[]) => void;
}) {
  const [dialogType, setDialogType] = useState<'delete' | 'view'>('view');

  // Use our new tRPC hook with integrated real-time sync
  const deleteInviteMutation = useDeleteInvite();

  const { id, name, usesRemaining, maxUses, expiresAt, createdAt, createdBy } =
    invite;

  // Generate invite URL using utility function
  const inviteUrl = getInviteUrl(id);

  const handleDeleteInvite = () => {
    deleteInviteMutation.mutate(
      { inviteId: id },
      {
        onSuccess: ([error, _result]: [Error | null, unknown]) => {
          if (error) {
            toast.error('Failed to delete invite', {
              description: 'The invite could not be deleted. Please try again.',
            });
            return;
          }

          toast.success('The invite has been successfully deleted.');
        },
        onError: () => {
          toast.error('Failed to delete invite', {
            description: 'An unexpected error occurred. Please try again.',
          });
        },
      }
    );
  };

  return (
    <Dialog>
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
          className='size-6 z-20 absolute left-4 top-4 md:top-0 md:bottom-0 my-auto hover:bg-primary transition-all'
        />
        <DialogTrigger
          onClick={() => {
            setDialogType('view');
          }}
          asChild
        >
          <div
            className={cn(
              'cursor-pointer border border-border shadow-md rounded-lg py-3 px-6 hover:bg-accent transition-all z-10 overflow-hidden',
              selectedInvites.includes(id) ? 'bg-primary/30' : 'bg-card'
            )}
          >
            <div className='flex items-center md:pl-8'>
              <div className='flex md:items-center gap-2 md:gap-8 flex-col md:flex-row w-full'>
                <div className='pl-8 md:pl-0 pr-8 md:pr-0 md:w-2/5'>
                  <h1 className='text-2xl overflow-hidden text-ellipsis whitespace-nowrap'>
                    {name
                      ? name
                      : `/invite/...${id.substring(id.length - 3, id.length)}`}
                  </h1>
                  <span className='text-sm text-muted-foreground'>
                    Created:{' '}
                    {createdAt.toLocaleString([], {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <div className='flex items-center gap-4 md:gap-8 px-3'>
                  <div className='flex items-center gap-1'>
                    <Icons.time className='size-8 text-muted-foreground' />
                    <span className='md:text-lg'>
                      {expiresAt ? timeUntil(expiresAt) : 'Never'}
                    </span>
                  </div>
                  {/* Uses left */}
                  <div className='flex items-center gap-1'>
                    <Icons.account className='size-8 text-muted-foreground' />
                    <span className='md:text-lg'>
                      {maxUses ? (
                        <span>
                          {usesRemaining}/{maxUses}
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
            className='hover:bg-destructive hover:text-destructive-foreground z-20 absolute right-4 top-3 md:top-0 md:bottom-0 my-auto'
            onClick={async () => {
              setDialogType('delete');
            }}
            variant='outline'
            size='icon'
          >
            <Icons.delete className='size-5' />
          </Button>
        </DialogTrigger>
      </div>

      <DialogContent>
        {dialogType === 'view' && (
          <div className='w-full overflow-hidden'>
            <DialogHeader className='w-full'>
              <DialogTitle className='text-2xl break-words'>
                {name ? name : 'Invite'}
              </DialogTitle>
            </DialogHeader>
            <div className='p-4 bg-white w-max rounded-xl mx-auto my-4 border border-border shadow-md'>
              <QRCode size={128} value={inviteUrl} />
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
                  {createdAt.toLocaleString([], {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <div className='flex items-center gap-1'>
                <span className='text-muted-foreground'>Created by:</span>
                <span className='flex items-center gap-2'>
                  {!createdBy.person.firstName && !createdBy.person.lastName
                    ? createdBy.person.username
                    : `${getFullName(
                        createdBy.person.firstName,
                        createdBy.person.lastName
                      )} (${createdBy.person.username})`}
                </span>
              </div>{' '}
              <div className='flex items-center gap-1'>
                <span className='text-muted-foreground'>Expires at:</span>
                <span>
                  {expiresAt
                    ? expiresAt?.toLocaleString([], {
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
                      {usesRemaining}/{maxUses} remaining
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
                  <Button
                    variant='ghost'
                    disabled={deleteInviteMutation.isLoading}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    onClick={handleDeleteInvite}
                    disabled={deleteInviteMutation.isLoading}
                    variant='destructive'
                  >
                    {deleteInviteMutation.isLoading ? 'Deleting...' : 'Delete'}
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
