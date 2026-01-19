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
import { useDeleteInvites } from '@/hooks/convex/use-invites';
import { useState } from 'react';
import { Id } from '@/convex/_generated/dataModel';

export function DeleteInvites({
  selectedInvites,
  setSelectedInvites,
  eventId,
}: {
  selectedInvites: Id<"invites">[];
  setSelectedInvites: (invites: Id<"invites">[]) => void;
  eventId: Id<"events">;
}) {
  const deleteInvites = useDeleteInvites(eventId);
  const [isOpen, setIsOpen] = useState(false);

  const handleDeleteInvites = async () => {
    // Close dialog immediately (optimistic updates)
    setIsOpen(false);
    const invitesToDelete = [...selectedInvites];
    setSelectedInvites([]);

    try {
      await deleteInvites(invitesToDelete);
      toast.success('Invites Deleted', {
        description: 'The invites have been successfully deleted.',
      });
    } catch {
      toast.error('Failed to delete invites', {
        description: 'An unexpected error occurred. Please try again.',
      });
      // Restore selection on failure
      setIsOpen(true);
      setSelectedInvites(invitesToDelete);
    }
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
              <Button variant='ghost'>Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button onClick={handleDeleteInvites} variant='destructive'>
                Delete
              </Button>
            </DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
