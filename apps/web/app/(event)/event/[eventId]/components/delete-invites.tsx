'use client';

import { deleteInviteAction } from '@/actions/invite-actions';
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
import { useState } from 'react';

export function DeleteInvites({
  selectedInvites,
  setSelectedInvites,
}: {
  selectedInvites: string[];
  setSelectedInvites: (invites: string[]) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteInvites = async () => {
    setIsLoading(true);
    try {
      for (const inviteId of selectedInvites) {
        const [error] = await deleteInviteAction({ inviteId });
        if (error) throw error;
      }
      toast.success('Invites Deleted', {
        description: 'The invites have been successfully deleted.',
      });
      setSelectedInvites([]);
    } catch {
      toast.error('Failed to delete invites', {
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
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
            <DialogClose>
              <Button variant='ghost' disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                onClick={handleDeleteInvites}
                disabled={isLoading}
                variant='destructive'
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
