'use client';

import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';
import { useDeleteInvite } from '@/hooks/mutations/use-delete-invite';
import { useState } from 'react';

export function DeleteInvites({
  selectedInvites,
  setSelectedInvites,
}: {
  selectedInvites: string[];
  setSelectedInvites: (invites: string[]) => void;
}) {
  const deleteInvite = useDeleteInvite();
  const [isOpen, setIsOpen] = useState(false);

  const handleDeleteInvites = () => {
    // Close dialog immediately (optimistic updates)
    setIsOpen(false);
    const invitesToDelete = [...selectedInvites];
    setSelectedInvites([]);
    
    // Track completion using an object to avoid closure issues
    const results = { success: 0, error: 0, total: invitesToDelete.length };
    const failedInvites: string[] = [];
    
    const checkCompletion = () => {
      if (results.success + results.error === results.total) {
        if (results.error === 0) {
          toast.success('Invites Deleted', {
            description: 'The invites have been successfully deleted.',
          });
        } else if (results.success === 0) {
          toast.error('Failed to delete invites', {
            description: 'An unexpected error occurred. Please try again.',
          });
          // Reopen dialog and restore selection if all failed
          setIsOpen(true);
          setSelectedInvites(failedInvites);
        } else {
          toast.warning('Some invites deleted', {
            description: `${results.success} deleted, ${results.error} failed.`,
          });
          // Restore failed invites to selection
          setSelectedInvites(failedInvites);
        }
      }
    };
    
    // Delete all invites (optimistic updates handle UI immediately)
    invitesToDelete.forEach((inviteId) => {
      deleteInvite.mutate(
        { inviteId },
        {
          onSuccess: () => {
            results.success++;
            checkCompletion();
          },
          onError: () => {
            results.error++;
            failedInvites.push(inviteId);
            checkCompletion();
          },
        }
      );
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button disabled={!selectedInvites.length} variant='destructive'>
          Delete {selectedInvites.length} Invite
          {selectedInvites.length === 1 ? '' : 's'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Delete {selectedInvites.length} Invite
            {selectedInvites.length === 1 ? '' : 's'}{' '}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the selected invites? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <div className='flex gap-4 justify-end'>
            <DialogClose asChild>
              <Button variant='ghost'>
                Cancel
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                onClick={handleDeleteInvites}
                variant='destructive'
              >
                Delete
              </Button>
            </DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
