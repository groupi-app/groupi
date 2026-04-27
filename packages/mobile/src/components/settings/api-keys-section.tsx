import { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from '@groupi/shared/platform';
import { authClient } from '@/lib/auth-client';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

type ApiKey = {
  id: string;
  name: string | null;
  start: string;
  createdAt: Date;
  expiresAt: Date | null;
};

export function ApiKeysSection() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('365');
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const mutedColor = useCSSVariable('--color-muted-foreground') as
    | string
    | undefined;

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
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
  }

  async function handleCreateKey() {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }

    setIsCreating(true);
    try {
      const expiresIn = parseInt(newKeyExpiry) * 24 * 60 * 60;
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
      toast.error(
        error instanceof Error ? error.message : 'Failed to create API key'
      );
    } finally {
      setIsCreating(false);
    }
  }

  function handleDeleteKey(keyId: string) {
    showConfirmDialog({
      title: 'Delete API Key',
      message:
        'Are you sure you want to delete this API key? Any applications using this key will no longer be able to authenticate.',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          const result = await authClient.apiKey.delete({ keyId });

          if (result.error) {
            toast.error(result.error.message || 'Failed to delete API key');
            return;
          }

          toast.success('API key deleted');
          await loadKeys();
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : 'Failed to delete API key'
          );
        }
      },
    });
  }

  async function handleCopyKey(text: string) {
    await Clipboard.setStringAsync(text);
    toast.success('Copied to clipboard');
  }

  function resetCreateDialog() {
    setShowCreateDialog(false);
    setNewKeyName('');
    setNewKeyExpiry('365');
    setNewKeyValue(null);
  }

  function formatDate(date: Date) {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function isExpired(expiresAt: Date | null) {
    if (!expiresAt) return false;
    return new Date() > expiresAt;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <View className='flex-row items-center gap-2'>
            <Ionicons
              name='link-outline'
              size={18}
              color={mutedColor ?? '#6b7280'}
            />
            <CardTitle>API Keys</CardTitle>
          </View>
          <Text variant='muted' className='text-sm'>
            Manage API keys for programmatic access to your account
          </Text>
        </CardHeader>
        <CardContent className='gap-3'>
          {isLoading ? (
            <View className='items-center justify-center py-6'>
              <ActivityIndicator size='small' />
            </View>
          ) : keys.length === 0 ? (
            <View className='items-center gap-4 py-4'>
              <Text className='text-center text-muted-foreground'>
                No API keys yet. Create one to get started.
              </Text>
              <Button onPress={() => setShowCreateDialog(true)}>
                <Ionicons name='add' size={16} color='white' />
                <Text>Create API Key</Text>
              </Button>
            </View>
          ) : (
            <>
              {keys.map(key => (
                <View
                  key={key.id}
                  className='gap-1 rounded-input border border-border p-3'
                >
                  <View className='flex-row items-center justify-between'>
                    <View className='flex-row items-center gap-2'>
                      <Text className='font-medium'>
                        {key.name || 'Unnamed Key'}
                      </Text>
                      {isExpired(key.expiresAt) && (
                        <Badge variant='destructive'>
                          <Text>Expired</Text>
                        </Badge>
                      )}
                    </View>
                    <Button
                      size='icon'
                      variant='ghost'
                      onPress={() => handleDeleteKey(key.id)}
                    >
                      <Ionicons
                        name='trash-outline'
                        size={16}
                        color='#ef4444'
                      />
                    </Button>
                  </View>
                  <Text className='font-mono text-sm text-muted-foreground'>
                    {key.start}...
                  </Text>
                  <View className='flex-row gap-4'>
                    <Text className='text-xs text-muted-foreground'>
                      Created: {formatDate(key.createdAt)}
                    </Text>
                    {key.expiresAt ? (
                      <Text className='text-xs text-muted-foreground'>
                        {isExpired(key.expiresAt) ? 'Expired' : 'Expires'}:{' '}
                        {formatDate(key.expiresAt)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
              <Button onPress={() => setShowCreateDialog(true)}>
                <Ionicons name='add' size={16} color='white' />
                <Text>Create New Key</Text>
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
            <View className='gap-4'>
              <View className='gap-1.5'>
                <Text variant='small' className='font-medium'>
                  Key Name
                </Text>
                <Input
                  value={newKeyName}
                  onChangeText={setNewKeyName}
                  placeholder='e.g., My Integration'
                />
              </View>
              <View className='gap-1.5'>
                <Text variant='small' className='font-medium'>
                  Expiration
                </Text>
                <Select
                  value={{
                    value: newKeyExpiry,
                    label:
                      newKeyExpiry === '30'
                        ? '30 days'
                        : newKeyExpiry === '90'
                          ? '90 days'
                          : newKeyExpiry === '365'
                            ? '1 year'
                            : 'Never expires',
                  }}
                  onValueChange={option => {
                    if (option) setNewKeyExpiry(option.value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select expiration' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem label='30 days' value='30' />
                    <SelectItem label='90 days' value='90' />
                    <SelectItem label='1 year' value='365' />
                    <SelectItem label='Never expires' value='0' />
                  </SelectContent>
                </Select>
              </View>
              <DialogFooter>
                <Button variant='outline' onPress={resetCreateDialog}>
                  Cancel
                </Button>
                <Button
                  onPress={handleCreateKey}
                  disabled={!newKeyName.trim()}
                  isLoading={isCreating}
                  loadingText='Creating...'
                >
                  Create Key
                </Button>
              </DialogFooter>
            </View>
          ) : (
            <View className='gap-4'>
              <View className='flex-row items-center gap-2 rounded-input bg-muted p-3'>
                <Text className='flex-1 font-mono text-sm' selectable>
                  {newKeyValue}
                </Text>
                <Button
                  size='icon'
                  variant='ghost'
                  onPress={() => handleCopyKey(newKeyValue)}
                >
                  <Ionicons
                    name='copy-outline'
                    size={16}
                    color={mutedColor ?? '#6b7280'}
                  />
                </Button>
              </View>
              <View className='rounded-input border border-border bg-bg-warning-subtle p-3'>
                <Text className='text-sm text-warning'>
                  Important: This is the only time you will see this key. Make
                  sure to copy and store it securely.
                </Text>
              </View>
              <DialogFooter>
                <Button onPress={resetCreateDialog}>Done</Button>
              </DialogFooter>
            </View>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
