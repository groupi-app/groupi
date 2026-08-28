import { useState } from 'react';
import { Share, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useMutation } from 'convex/react';
import { useCSSVariable } from 'uniwind';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { LabeledInput } from '@/components/ui/labeled-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { getPublicInviteUrl } from '@/lib/public-urls';
import { toast } from '@groupi/shared/platform';
import {
  InvitePanelScrollView,
  InviteSectionIntro,
} from './invite-panel-shell';
import type { InviteData, InviteRecord } from './invite-types';
import {
  describeInviteExpiry,
  formatInviteDate,
  getInviteExpiryTimestamp,
  INVITE_EXPIRY_OPTIONS,
  type InviteExpiry,
  validateMaxUses,
} from './invite-utils';

export function LinkInvitePanel({
  eventId,
  inviteData,
}: {
  eventId: Id<'events'>;
  inviteData: InviteData;
}) {
  const [name, setName] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [maxUsesError, setMaxUsesError] = useState<string | undefined>();
  const [expiry, setExpiry] = useState<InviteExpiry>('never');
  const [isCreating, setIsCreating] = useState(false);
  const createInvite = useMutation(api.invites.mutations.createInvite);
  const deleteInvite = useMutation(api.invites.mutations.deleteInvites);
  const links = inviteData.invites.filter(invite => !invite.hasEmail);

  async function handleCreateInvite() {
    const validatedUses = validateMaxUses(maxUses);
    if (validatedUses.error) {
      setMaxUsesError(validatedUses.error);
      return;
    }

    setMaxUsesError(undefined);
    setIsCreating(true);
    try {
      const result = await createInvite({
        eventId,
        name: name.trim() || undefined,
        usesTotal: validatedUses.value,
        expiresAt: getInviteExpiryTimestamp(expiry),
      });
      await Clipboard.setStringAsync(getPublicInviteUrl(result.invite.token));
      setName('');
      setMaxUses('');
      setExpiry('never');
      toast.success('Invite link created and copied');
    } catch {
      toast.error('Failed to create invite link');
    } finally {
      setIsCreating(false);
    }
  }

  async function copyInvite(token: string) {
    await Clipboard.setStringAsync(getPublicInviteUrl(token));
    toast.success('Invite link copied');
  }

  async function shareInvite(token: string) {
    const url = getPublicInviteUrl(token);
    try {
      await Share.share({ message: `Join my event on Groupi! ${url}`, url });
    } catch {
      toast.error('Could not open sharing');
    }
  }

  function confirmDelete(invite: InviteRecord) {
    showConfirmDialog({
      title: 'Delete Invite Link',
      message: 'This link will stop working immediately.',
      confirmLabel: 'Delete Link',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteInvite({ inviteIds: [invite._id] });
          toast.success('Invite link deleted');
        } catch {
          toast.error('Failed to delete invite link');
        }
      },
    });
  }

  const selectedExpiry =
    INVITE_EXPIRY_OPTIONS.find(option => option.value === expiry) ??
    INVITE_EXPIRY_OPTIONS[0];

  return (
    <InvitePanelScrollView>
      <InviteSectionIntro
        icon='link-outline'
        title='Share one link anywhere'
        description='Set an optional label, expiration, or guest limit. New links are copied automatically.'
      />

      <Card className='gap-4'>
        <View>
          <Text className='text-base font-semibold text-foreground'>
            Create a link
          </Text>
          <Text className='mt-1 text-sm text-muted-foreground'>
            Leave the controls blank for an unlimited link that never expires.
          </Text>
        </View>
        <LabeledInput
          label='Link name (optional)'
          placeholder='Friends, family, team…'
          value={name}
          onChangeText={setName}
          maxLength={64}
          returnKeyType='next'
        />
        <View className='gap-1.5'>
          <Text className='text-sm font-medium text-foreground'>
            Expires in
          </Text>
          <Select
            value={{ value: expiry, label: selectedExpiry.label }}
            onValueChange={option => {
              if (option) setExpiry(option.value as InviteExpiry);
            }}
          >
            <SelectTrigger accessibilityLabel='Invite link expiration'>
              <SelectValue placeholder='Never' />
            </SelectTrigger>
            <SelectContent>
              {INVITE_EXPIRY_OPTIONS.map(option => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  label={option.label}
                />
              ))}
            </SelectContent>
          </Select>
        </View>
        <LabeledInput
          label='Maximum uses (optional)'
          placeholder='Unlimited'
          value={maxUses}
          onChangeText={value => {
            setMaxUses(value.replace(/[^0-9]/g, ''));
            setMaxUsesError(undefined);
          }}
          error={maxUsesError}
          keyboardType='number-pad'
          returnKeyType='done'
        />
        <Button
          onPress={handleCreateInvite}
          isLoading={isCreating}
          loadingText='Creating…'
          accessibilityHint='Creates the link and copies it to the clipboard'
        >
          <Ionicons name='add-circle-outline' size={19} />
          <Text>Create & Copy Link</Text>
        </Button>
      </Card>

      <View className='gap-2'>
        <Text className='text-base font-semibold text-foreground'>
          Active links
        </Text>
        {links.length === 0 ? (
          <View className='items-center rounded-card border border-dashed border-border px-5 py-8'>
            <Ionicons
              name='link-outline'
              size={30}
              className='accent-muted-foreground'
            />
            <Text className='mt-2 font-medium text-foreground'>
              No invite links yet
            </Text>
            <Text className='mt-1 text-center text-sm text-muted-foreground'>
              Create one above when you are ready to share.
            </Text>
          </View>
        ) : (
          links.map(invite => (
            <InviteLinkCard
              key={invite._id}
              invite={invite}
              onCopy={() => copyInvite(invite.token)}
              onShare={() => shareInvite(invite.token)}
              onDelete={() => confirmDelete(invite)}
            />
          ))
        )}
      </View>
    </InvitePanelScrollView>
  );
}

function InviteLinkCard({
  invite,
  onCopy,
  onShare,
  onDelete,
}: {
  invite: InviteRecord;
  onCopy: () => void;
  onShare: () => void;
  onDelete: () => void;
}) {
  const [renderedAt] = useState(() => Date.now());
  const errorColor = String(
    useCSSVariable('--color-destructive') ?? 'transparent'
  );
  const primaryColor = String(
    useCSSVariable('--color-primary') ?? 'transparent'
  );
  const remaining = invite.usesRemaining ?? invite.usesTotal;
  const isExpired = Boolean(invite.expiresAt && invite.expiresAt <= renderedAt);

  return (
    <Card className='gap-3'>
      <View className='flex-row items-start gap-3'>
        <View className='size-10 items-center justify-center rounded-full bg-primary/10'>
          <Ionicons name='link-outline' size={20} color={primaryColor} />
        </View>
        <View className='flex-1'>
          <Text className='font-semibold text-foreground'>
            {invite.name || 'Invite link'}
          </Text>
          <Text className='mt-0.5 text-xs text-muted-foreground'>
            …{invite.token.slice(-8)} · Created{' '}
            {formatInviteDate(invite._creationTime)}
          </Text>
        </View>
        <Badge variant={isExpired ? 'error' : 'success'}>
          <Text>{isExpired ? 'Expired' : 'Active'}</Text>
        </Badge>
      </View>
      <View className='flex-row flex-wrap gap-2'>
        <Badge variant='outline'>
          <Text>{describeInviteExpiry(invite.expiresAt, renderedAt)}</Text>
        </Badge>
        <Badge variant='outline'>
          <Text>
            {invite.usesTotal === undefined
              ? 'Unlimited uses'
              : `${remaining ?? 0}/${invite.usesTotal} uses left`}
          </Text>
        </Badge>
      </View>
      <View className='flex-row gap-2'>
        <Button
          variant='outline'
          size='sm'
          className='flex-1'
          onPress={onCopy}
          accessibilityLabel={`Copy ${invite.name || 'invite'} link`}
        >
          <Ionicons name='copy-outline' size={17} color={primaryColor} />
          <Text>Copy</Text>
        </Button>
        <Button
          variant='outline'
          size='sm'
          className='flex-1'
          onPress={onShare}
          accessibilityLabel={`Share ${invite.name || 'invite'} link`}
        >
          <Ionicons name='share-outline' size={17} color={primaryColor} />
          <Text>Share</Text>
        </Button>
        <Button
          variant='ghost'
          size='icon'
          onPress={onDelete}
          accessibilityLabel={`Delete ${invite.name || 'invite'} link`}
        >
          <Ionicons name='trash-outline' size={19} color={errorColor} />
        </Button>
      </View>
    </Card>
  );
}
