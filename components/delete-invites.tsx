import { deleteInvites } from '@/lib/actions/invite';
import { Button } from './ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { useToast } from './ui/use-toast';

export function DeleteInvites({
  selectedInvites,
  setSelectedInvites,
}: {
  selectedInvites: string[];
  setSelectedInvites: (invites: string[]) => void;
}) {
  const { toast } = useToast();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={!selectedInvites.length} variant="destructive">
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
            Are you sure you want to delete the selected invites? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <div className="flex gap-4 justify-end">
            <DialogClose>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                onClick={async () => {
                  const res = await deleteInvites(selectedInvites);
                  if (res.success) {
                    toast({
                      title: 'Invites Deleted',
                      description: 'The invites have been successfully deleted.',
                    });
                    setSelectedInvites([]);
                  }
                  if (res.error) {
                    toast({
                      title: 'Error',
                      description: 'Unable to delete invites.',
                      variant: 'destructive',
                    });
                  }
                }}
                variant="destructive"
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
