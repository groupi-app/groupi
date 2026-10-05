'use client';

import { useState } from 'react';
import { AccountResolutionBoundary } from '@groupi/shared/hooks';
import { Button } from '@/components/ui/button';
import { AccountResponsibilities } from '@/components/settings/account-responsibilities';
import {
  useAccountReadiness,
  useAccountResolutionActions,
} from '@/hooks/convex/use-account-resolution';
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
import { signOut } from '@/lib/auth-client';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string | null;
}

export function DeleteAccountModal(props: DeleteAccountModalProps) {
  return (
    <AccountResolutionBoundary
      fallback={retry => (
        <div role='alert' className='space-y-3'>
          <p>
            Could not check account ownership. Reconnect and retry the check
            before deleting.
          </p>
          <Button type='button' variant='outline' onClick={retry}>
            Retry ownership check
          </Button>
        </div>
      )}
    >
      <DeleteAccountContents {...props} />
    </AccountResolutionBoundary>
  );
}

function DeleteAccountContents({
  open,
  onOpenChange,
  username,
}: DeleteAccountModalProps) {
  const readiness = useAccountReadiness();
  const [confirmUsername, setConfirmUsername] = useState('');
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const usernameMatches = username
    ? confirmUsername.trim() === username.trim()
    : false;

  const { deleteAccount } = useAccountResolutionActions();

  const handleDelete = async () => {
    if (!usernameMatches || !readiness?.canDelete) {
      return;
    }

    setDeleting(true);

    try {
      // The hook expects a confirmation parameter
      await deleteAccount({ confirmation: confirmUsername });

      // Sign out and redirect directly to sign-in page
      // (avoids brief flash of onboarding page during auth redirect chain)
      await signOut();
      router.push('/sign-in');
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete account'
      );
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='max-h-[90vh] overflow-y-auto'>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Account</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove all your data from our servers. You will not be
            able to recover your account.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AccountResponsibilities />
        <div className='space-y-4 py-4'>
          <div className='space-y-4'>
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
            onClick={event => {
              event.preventDefault();
              void handleDelete();
            }}
            disabled={!usernameMatches || deleting || !readiness?.canDelete}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {deleting && <Icons.spinner className='size-4 animate-spin' />}
            {deleting ? 'Deleting...' : 'Delete Account'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
