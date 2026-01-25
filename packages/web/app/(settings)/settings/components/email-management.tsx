'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/lib/convex';
import { toast } from 'sonner';
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
import { cn } from '@/lib/utils';

export function EmailManagement() {
  const [newEmail, setNewEmail] = useState('');
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [emailToRemove, setEmailToRemove] = useState<string | null>(null);
  const [emailToMakePrimary, setEmailToMakePrimary] = useState<string | null>(
    null
  );

  // Queries
  // @ts-expect-error - Type instantiation is excessively deep, but query works correctly at runtime
  const emails = useQuery(api.emails.queries.getCurrentUserEmails, {});
  const emailAvailability = useQuery(
    api.emails.queries.checkEmailAvailability,
    newEmail.trim() ? { email: newEmail.trim() } : 'skip'
  );

  // Mutations
  const requestAddEmail = useMutation(api.emails.mutations.requestAddEmail);
  const removeEmail = useMutation(api.emails.mutations.removeAdditionalEmail);
  const makePrimaryEmail = useMutation(api.emails.mutations.setPrimaryEmail);
  const resendVerification = useMutation(
    api.emails.mutations.resendVerificationEmail
  );

  const handleAddEmail = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;

    if (emailAvailability && !emailAvailability.available) {
      toast.error(emailAvailability.reason);
      return;
    }

    setIsAddingEmail(true);
    try {
      await requestAddEmail({ email });
      toast.success(`Verification email sent to ${email}`);
      setNewEmail('');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to send verification email'
      );
    } finally {
      setIsAddingEmail(false);
    }
  };

  const handleRemoveEmail = async (email: string) => {
    try {
      await removeEmail({ email });
      toast.success('Email removed from your account');
      setEmailToRemove(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove email'
      );
    }
  };

  const handleMakePrimary = async (email: string) => {
    try {
      await makePrimaryEmail({ email });
      toast.success('Primary email updated');
      setEmailToMakePrimary(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update primary email'
      );
    }
  };

  const handleResendVerification = async (email: string) => {
    try {
      await resendVerification({ email });
      toast.success('Verification email resent');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to resend verification'
      );
    }
  };

  if (!emails) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Addresses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <Icons.spinner className='h-6 w-6 animate-spin' />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort emails: primary first, then additional, then pending
  const sortedEmails = emails.allEmails.sort((a, b) => {
    if (a.isPrimary) return -1;
    if (b.isPrimary) return 1;
    if (a.status === 'verified' && b.status === 'pending') return -1;
    if (a.status === 'pending' && b.status === 'verified') return 1;
    return 0;
  });

  const canAddEmail = newEmail.trim() && emailAvailability?.available;

  return (
    <>
      <Card id='emails'>
        <CardHeader>
          <CardTitle>Email Addresses</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Email List */}
          <div className='space-y-3'>
            {sortedEmails.map(email => (
              <div
                key={email.address}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border',
                  email.isPrimary
                    ? 'bg-primary/5 border-primary/20'
                    : email.status === 'pending'
                      ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                      : 'bg-muted/30'
                )}
              >
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2'>
                    {email.status === 'verified' ? (
                      <Icons.mail className='h-4 w-4 text-green-600' />
                    ) : (
                      <Icons.clock className='h-4 w-4 text-orange-600' />
                    )}
                    <span className='font-medium truncate'>
                      {email.address}
                    </span>
                  </div>
                  <div className='flex items-center gap-2 mt-1'>
                    {email.isPrimary && (
                      <Badge variant='default' className='text-xs'>
                        Primary
                      </Badge>
                    )}
                    {email.status === 'verified' && !email.isPrimary && (
                      <Badge variant='secondary' className='text-xs'>
                        Verified
                      </Badge>
                    )}
                    {email.status === 'pending' && (
                      <>
                        <Badge
                          variant='outline'
                          className='text-xs text-orange-600'
                        >
                          Verification Pending
                        </Badge>
                        {email.expiresAt && (
                          <span className='text-xs text-muted-foreground'>
                            Expires{' '}
                            {new Date(email.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className='flex items-center gap-2 ml-4'>
                  {email.status === 'pending' && (
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleResendVerification(email.address)}
                    >
                      Resend
                    </Button>
                  )}

                  {email.status === 'verified' && !email.isPrimary && (
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => setEmailToMakePrimary(email.address)}
                    >
                      Make Primary
                    </Button>
                  )}

                  {!email.isPrimary && (
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => setEmailToRemove(email.address)}
                      className='text-destructive hover:text-destructive'
                    >
                      <Icons.trash className='h-4 w-4' />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add New Email */}
          <div className='border-t pt-4'>
            <div className='space-y-3'>
              <h4 className='text-sm font-medium'>Add Email Address</h4>
              <div className='flex gap-2'>
                <div className='flex-1'>
                  <Input
                    type='email'
                    placeholder='Enter email address'
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && canAddEmail) {
                        handleAddEmail();
                      }
                    }}
                  />
                  {newEmail.trim() &&
                    emailAvailability &&
                    !emailAvailability.available && (
                      <p className='text-xs text-destructive mt-1'>
                        {emailAvailability.reason}
                      </p>
                    )}
                </div>
                <Button
                  onClick={handleAddEmail}
                  disabled={!canAddEmail}
                  isLoading={isAddingEmail}
                  icon={<Icons.plus className='h-4 w-4' />}
                >
                  Add
                </Button>
              </div>
              <p className='text-xs text-muted-foreground'>
                A verification email will be sent to the address you provide.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Remove Email Dialog */}
      <AlertDialog
        open={!!emailToRemove}
        onOpenChange={() => setEmailToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Email Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{emailToRemove}</strong>{' '}
              from your account? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => emailToRemove && handleRemoveEmail(emailToRemove)}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Make Primary Email Dialog */}
      <AlertDialog
        open={!!emailToMakePrimary}
        onOpenChange={() => setEmailToMakePrimary(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Primary Email</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to make{' '}
              <strong>{emailToMakePrimary}</strong> your primary email address?
              This will be used for account authentication and important
              notifications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                emailToMakePrimary && handleMakePrimary(emailToMakePrimary)
              }
            >
              Make Primary
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
