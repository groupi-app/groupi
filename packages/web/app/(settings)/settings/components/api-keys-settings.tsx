'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';

type ApiKey = {
  id: string;
  name: string | null;
  start: string;
  createdAt: Date;
  expiresAt: Date | null;
};

export function ApiKeysSettings() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('365'); // days
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load API keys on mount
  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    setIsLoading(true);
    try {
      const result = await authClient.apiKey.list();
      if (result.data) {
        setKeys(
          result.data.map(key => ({
            id: key.id,
            name: key.name ?? null,
            start: key.start ?? key.id.slice(0, 8),
            createdAt: new Date(key.createdAt),
            expiresAt: key.expiresAt ? new Date(key.expiresAt) : null,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  };

  const createKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }

    setIsCreating(true);
    try {
      const expiresIn = parseInt(newKeyExpiry) * 24 * 60 * 60; // Convert days to seconds
      const result = await authClient.apiKey.create({
        name: newKeyName.trim(),
        expiresIn: expiresIn > 0 ? expiresIn : undefined,
      });

      if (result.error) {
        toast.error(result.error.message || 'Failed to create API key');
        return;
      }

      if (result.data?.key) {
        setNewKeyValue(result.data.key);
        await loadKeys();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create API key';
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteKey = async () => {
    if (!selectedKeyId) return;

    setIsDeleting(true);
    try {
      const result = await authClient.apiKey.delete({ keyId: selectedKeyId });

      if (result.error) {
        toast.error(result.error.message || 'Failed to delete API key');
        return;
      }

      toast.success('API key deleted');
      setShowDeleteDialog(false);
      setSelectedKeyId(null);
      await loadKeys();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete API key';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const resetCreateDialog = () => {
    setShowCreateDialog(false);
    setNewKeyName('');
    setNewKeyExpiry('365');
    setNewKeyValue(null);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    return new Date() > expiresAt;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Icons.link className='h-5 w-5' />
            API Keys
          </CardTitle>
          <CardDescription>
            Manage API keys for programmatic access to your account
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <Icons.spinner className='h-6 w-6 animate-spin text-muted-foreground' />
            </div>
          ) : keys.length === 0 ? (
            <div className='text-center py-8'>
              <p className='text-muted-foreground mb-4'>
                No API keys yet. Create one to get started.
              </p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                icon={<Icons.plus className='h-4 w-4' />}
              >
                Create API Key
              </Button>
            </div>
          ) : (
            <>
              <div className='space-y-3'>
                {keys.map(key => (
                  <div
                    key={key.id}
                    className='flex items-center justify-between p-4 rounded-lg border'
                  >
                    <div className='space-y-1'>
                      <div className='flex items-center gap-2'>
                        <p className='font-medium'>
                          {key.name || 'Unnamed Key'}
                        </p>
                        {isExpired(key.expiresAt) && (
                          <span className='text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 px-2 py-0.5 rounded'>
                            Expired
                          </span>
                        )}
                      </div>
                      <p className='text-sm text-muted-foreground font-mono'>
                        {key.start}...
                      </p>
                      <div className='flex gap-4 text-xs text-muted-foreground'>
                        <span>Created: {formatDate(key.createdAt)}</span>
                        {key.expiresAt && (
                          <span>
                            {isExpired(key.expiresAt) ? 'Expired' : 'Expires'}:{' '}
                            {formatDate(key.expiresAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => {
                        setSelectedKeyId(key.id);
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
                onClick={() => setShowCreateDialog(true)}
                icon={<Icons.plus className='h-4 w-4' />}
              >
                Create New Key
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={resetCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newKeyValue ? 'Save Your API Key' : 'Create API Key'}
            </DialogTitle>
            <DialogDescription>
              {newKeyValue
                ? 'Copy this key now. You will not be able to see it again.'
                : 'Create a new API key for programmatic access.'}
            </DialogDescription>
          </DialogHeader>

          {!newKeyValue ? (
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='key-name'>Key Name</Label>
                <Input
                  id='key-name'
                  placeholder='e.g., My Integration'
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='key-expiry'>Expiration</Label>
                <Select value={newKeyExpiry} onValueChange={setNewKeyExpiry}>
                  <SelectTrigger id='key-expiry'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='30'>30 days</SelectItem>
                    <SelectItem value='90'>90 days</SelectItem>
                    <SelectItem value='365'>1 year</SelectItem>
                    <SelectItem value='0'>Never expires</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant='outline' onClick={resetCreateDialog}>
                  Cancel
                </Button>
                <Button
                  onClick={createKey}
                  disabled={!newKeyName.trim()}
                  isLoading={isCreating}
                  loadingText='Creating...'
                >
                  Create Key
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='p-4 bg-muted rounded-lg'>
                <div className='flex items-center justify-between gap-2'>
                  <code className='text-sm break-all'>{newKeyValue}</code>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => copyToClipboard(newKeyValue)}
                    className='shrink-0'
                  >
                    <Icons.copy className='h-4 w-4' />
                  </Button>
                </div>
              </div>
              <div className='bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3'>
                <p className='text-sm text-yellow-800 dark:text-yellow-200'>
                  <strong>Important:</strong> This is the only time you will see
                  this key. Make sure to copy and store it securely.
                </p>
              </div>
              <DialogFooter>
                <Button onClick={resetCreateDialog}>Done</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Key Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this API key? Any applications
              using this key will no longer be able to authenticate.
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
              onClick={deleteKey}
              isLoading={isDeleting}
              loadingText='Deleting...'
            >
              Delete Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
