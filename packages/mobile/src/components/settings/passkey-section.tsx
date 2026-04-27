import { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from '@groupi/shared/platform';
import { authClient } from '@/lib/auth-client';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

type Passkey = {
  id: string;
  name: string | null;
  createdAt: Date;
};

export function PasskeySection() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const primaryColor = useCSSVariable('--color-primary') as string | undefined;
  const mutedColor = useCSSVariable('--color-muted-foreground') as
    | string
    | undefined;

  useEffect(() => {
    loadPasskeys();
  }, []);

  async function loadPasskeys() {
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
  }

  async function handleAddPasskey() {
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
      if (message.includes('cancel') || message.includes('abort')) {
        return;
      }
      toast.error(message);
    } finally {
      setIsAdding(false);
    }
  }

  function handleDeletePasskey(passkeyId: string) {
    showConfirmDialog({
      title: 'Delete Passkey',
      message:
        "Are you sure you want to delete this passkey? You won't be able to use it to sign in anymore.",
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          const result = await authClient.passkey.deletePasskey({
            id: passkeyId,
          });

          if (result.error) {
            toast.error(result.error.message || 'Failed to delete passkey');
            return;
          }

          toast.success('Passkey deleted');
          await loadPasskeys();
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : 'Failed to delete passkey'
          );
        }
      },
    });
  }

  async function handleUpdateName(id: string) {
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
        toast.error(result.error.message || 'Failed to rename passkey');
        return;
      }

      toast.success('Passkey renamed');
      await loadPasskeys();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to rename passkey'
      );
    } finally {
      setEditingId(null);
      setEditName('');
    }
  }

  function formatDate(date: Date) {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <Card>
      <CardHeader>
        <View className='flex-row items-center gap-2'>
          <Ionicons
            name='key-outline'
            size={18}
            color={mutedColor ?? '#6b7280'}
          />
          <CardTitle>Passkeys</CardTitle>
        </View>
        <Text variant='muted' className='text-sm'>
          Sign in quickly and securely using your device&apos;s biometrics
        </Text>
      </CardHeader>
      <CardContent className='gap-3'>
        {isLoading ? (
          <View className='items-center justify-center py-6'>
            <ActivityIndicator size='small' />
          </View>
        ) : passkeys.length === 0 ? (
          <View className='items-center gap-4 py-4'>
            <Text className='text-center text-muted-foreground'>
              No passkeys yet. Add one to sign in faster with Face ID, Touch ID,
              or fingerprint.
            </Text>
            <Button
              onPress={handleAddPasskey}
              isLoading={isAdding}
              loadingText='Setting up...'
            >
              <Ionicons name='add' size={16} color='white' />
              <Text>Add Passkey</Text>
            </Button>
          </View>
        ) : (
          <>
            {passkeys.map(passkey => (
              <View
                key={passkey.id}
                className='flex-row items-center justify-between rounded-input border border-border p-3'
              >
                <View className='flex-row items-center gap-3 flex-1'>
                  <View className='h-8 w-8 items-center justify-center rounded-full bg-primary/10'>
                    <Ionicons
                      name='key-outline'
                      size={14}
                      color={primaryColor ?? '#8b5cf6'}
                    />
                  </View>
                  <View className='flex-1'>
                    {editingId === passkey.id ? (
                      <Input
                        value={editName}
                        onChangeText={setEditName}
                        autoFocus
                        onBlur={() => handleUpdateName(passkey.id)}
                        onSubmitEditing={() => handleUpdateName(passkey.id)}
                        className='h-8'
                      />
                    ) : (
                      <Text
                        className='font-medium'
                        onPress={() => {
                          setEditingId(passkey.id);
                          setEditName(passkey.name || 'Passkey');
                        }}
                      >
                        {passkey.name || 'Passkey'}
                      </Text>
                    )}
                    <Text variant='muted' className='text-xs'>
                      Added {formatDate(passkey.createdAt)}
                    </Text>
                  </View>
                </View>
                <Button
                  size='icon'
                  variant='ghost'
                  onPress={() => handleDeletePasskey(passkey.id)}
                >
                  <Ionicons name='trash-outline' size={16} color='#ef4444' />
                </Button>
              </View>
            ))}
            <Button
              variant='outline'
              onPress={handleAddPasskey}
              isLoading={isAdding}
              loadingText='Setting up...'
            >
              <Ionicons name='add' size={16} color={mutedColor ?? '#6b7280'} />
              <Text>Add Another Passkey</Text>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
