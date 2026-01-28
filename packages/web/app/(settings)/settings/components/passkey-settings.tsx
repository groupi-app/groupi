'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';

type Passkey = {
  id: string;
  name: string | null;
  createdAt: Date;
};

export function PasskeySettings() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPasskeyId, setSelectedPasskeyId] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isSupported, setIsSupported] = useState(true);

  // Check if passkeys are supported
  useEffect(() => {
    const checkSupport = async () => {
      if (typeof window === 'undefined') return;

      if (!window.PublicKeyCredential) {
        setIsSupported(false);
        setIsLoading(false);
        return;
      }

      try {
        const available =
          await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setIsSupported(available);
      } catch {
        setIsSupported(false);
      }
    };

    checkSupport();
  }, []);

  // Load passkeys on mount
  useEffect(() => {
    if (isSupported) {
      loadPasskeys();
    }
  }, [isSupported]);

  const loadPasskeys = async () => {
    setIsLoading(true);
    try {
      const result = await authClient.passkey.listUserPasskeys();
      if (result.data) {
        setPasskeys(
          result.data.map(pk => ({
            id: pk.id,
            name: pk.name ?? null,
            createdAt: new Date(pk.createdAt),
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load passkeys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addPasskey = async () => {
    setIsAdding(true);
    try {
      const result = await authClient.passkey.addPasskey({
        name: `Passkey ${passkeys.length + 1}`,
      });

      if (result.error) {
        toast.error(result.error.message || 'Failed to add passkey');
        return;
      }

      toast.success('Passkey added successfully');
      await loadPasskeys();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to add passkey';
      // Handle user cancellation gracefully
      if (message.includes('cancel') || message.includes('abort')) {
        return;
      }
      toast.error(message);
    } finally {
      setIsAdding(false);
    }
  };

  const deletePasskey = async () => {
    if (!selectedPasskeyId) return;

    setIsDeleting(true);
    try {
      const result = await authClient.passkey.deletePasskey({
        id: selectedPasskeyId,
      });

      if (result.error) {
        toast.error(result.error.message || 'Failed to delete passkey');
        return;
      }

      toast.success('Passkey deleted');
      setShowDeleteDialog(false);
      setSelectedPasskeyId(null);
      await loadPasskeys();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete passkey';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const updatePasskeyName = async (id: string) => {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const result = await authClient.passkey.updatePasskey({
        id,
        name: editName.trim(),
      });

      if (result.error) {
        toast.error(result.error.message || 'Failed to update passkey');
        return;
      }

      toast.success('Passkey renamed');
      await loadPasskeys();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update passkey';
      toast.error(message);
    } finally {
      setEditingId(null);
      setEditName('');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // If passkeys are not supported
  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Icons.key className='h-5 w-5' />
            Passkeys
          </CardTitle>
          <CardDescription>
            Passwordless sign-in using your device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>
            Passkeys are not supported on this device or browser. Try using a
            modern browser like Chrome, Safari, or Edge on a device with
            biometric authentication.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Icons.key className='h-5 w-5' />
            Passkeys
          </CardTitle>
          <CardDescription>
            Sign in quickly and securely using your device&apos;s biometrics
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <Icons.spinner className='h-6 w-6 animate-spin text-muted-foreground' />
            </div>
          ) : passkeys.length === 0 ? (
            <div className='text-center py-6'>
              <p className='text-muted-foreground mb-4'>
                No passkeys yet. Add one to sign in faster with Face ID, Touch
                ID, or Windows Hello.
              </p>
              <Button
                onClick={addPasskey}
                isLoading={isAdding}
                loadingText='Setting up...'
                icon={<Icons.plus className='h-4 w-4' />}
              >
                Add Passkey
              </Button>
            </div>
          ) : (
            <>
              <div className='space-y-3'>
                {passkeys.map(passkey => (
                  <div
                    key={passkey.id}
                    className='flex items-center justify-between p-4 rounded-lg border'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='p-2 rounded-full bg-primary/10'>
                        <Icons.key className='h-4 w-4 text-primary' />
                      </div>
                      <div>
                        {editingId === passkey.id ? (
                          <div className='flex items-center gap-2'>
                            <Input
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              className='h-8 w-40'
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  updatePasskeyName(passkey.id);
                                } else if (e.key === 'Escape') {
                                  setEditingId(null);
                                  setEditName('');
                                }
                              }}
                              onBlur={() => updatePasskeyName(passkey.id)}
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(passkey.id);
                              setEditName(passkey.name || 'Passkey');
                            }}
                            className='font-medium hover:underline text-left'
                          >
                            {passkey.name || 'Passkey'}
                          </button>
                        )}
                        <p className='text-xs text-muted-foreground'>
                          Added {formatDate(passkey.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => {
                        setSelectedPasskeyId(passkey.id);
                        setShowDeleteDialog(true);
                      }}
                      className='text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950'
                    >
                      <Icons.trash className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                onClick={addPasskey}
                variant='outline'
                isLoading={isAdding}
                loadingText='Setting up...'
                icon={<Icons.plus className='h-4 w-4' />}
              >
                Add Another Passkey
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Passkey</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this passkey? You won&apos;t be
              able to use it to sign in anymore.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={deletePasskey}
              isLoading={isDeleting}
              loadingText='Deleting...'
            >
              Delete Passkey
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
