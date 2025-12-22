'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { deleteAccountAction } from '@/actions/account-actions';
import { signOut } from '@/lib/auth-client';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string | null;
}

export function DeleteAccountModal({
  open,
  onOpenChange,
  username,
}: DeleteAccountModalProps) {
  const [confirmUsername, setConfirmUsername] = useState('');
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const usernameMatches = username
    ? confirmUsername.trim() === username.trim()
    : false;

  const handleDelete = async () => {
    if (!usernameMatches) {
      return;
    }

    setDeleting(true);

    try {
      const [error] = await deleteAccountAction();

      if (error) {
        toast.error(error.message || 'Failed to delete account');
        setDeleting(false);
      } else {
        // Sign out and redirect to home
        await signOut();
        router.push('/');
        router.refresh();
      }
    } catch {
      toast.error('An unexpected error occurred');
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Account</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove all your data from our servers. You will not be
            able to recover your account.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='confirm-username'>
              To confirm, type your username:{' '}
              <span className='font-bold'>{username || '(no username)'}</span>
            </Label>
            <Input
              id='confirm-username'
              value={confirmUsername}
              onChange={e => setConfirmUsername(e.target.value)}
              placeholder='Enter your username'
              disabled={deleting}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!usernameMatches || deleting}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {deleting ? (
              <>
                <Icons.spinner className='size-4 animate-spin mr-2' />
                Deleting...
              </>
            ) : (
              'Delete Account'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

