import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { useCSSVariable } from 'uniwind';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { LabeledInput } from '@/components/ui/labeled-input';
import { LabeledTextarea } from '@/components/ui/labeled-textarea';
import { Text } from '@/components/ui/text';
import { toast } from '@groupi/shared/platform';
import {
  InvitePanelScrollView,
  InviteSectionIntro,
} from './invite-panel-shell';
import type { InviteData, InviteRecord } from './invite-types';
import { parseEmailRecipients } from './invite-utils';

const MAX_EMAIL_MESSAGE_LENGTH = 480;

interface QueuedEmailRecipient {
  email: string;
  recipientName?: string;
  plusOnes?: number;
}

export function EmailInvitePanel({
  eventId,
  inviteData,
}: {
  eventId: Id<'events'>;
  inviteData: InviteData;
}) {
  const [emails, setEmails] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [plusOnes, setPlusOnes] = useState('0');
  const [customMessage, setCustomMessage] = useState('');
  const [inputError, setInputError] = useState<string>();
  const [queued, setQueued] = useState<QueuedEmailRecipient[]>([]);
  const [isSending, setIsSending] = useState(false);
  const createEmailInvites = useMutation(
    api.invites.mutations.createEmailInvites
  );
  const sendPendingEmailInvites = useMutation(
    api.invites.mutations.sendPendingEmailInvites
  );
  const deleteInvites = useMutation(api.invites.mutations.deleteInvites);
  const emailInvites = inviteData.invites.filter(invite => invite.hasEmail);
  const pendingServerInvites = emailInvites.filter(
    invite => invite.emailStatus === 'pending'
  );

  function handleAddRecipients() {
    const parsed = parseEmailRecipients(emails);
    if (parsed.invalid.length > 0 || parsed.valid.length === 0) {
      setInputError(
        parsed.invalid.length > 0
          ? `Check: ${parsed.invalid.slice(0, 2).join(', ')}`
          : 'Enter at least one valid email address.'
      );
      return;
    }

    const existing = new Set([
      ...queued.map(recipient => recipient.email),
      ...emailInvites.flatMap(invite => (invite.email ? [invite.email] : [])),
    ]);
    const parsedPlusOnes = Math.min(20, Math.max(0, Number(plusOnes) || 0));
    const nextRecipients = parsed.valid
      .filter(email => !existing.has(email))
      .map(email => ({
        email,
        recipientName:
          parsed.valid.length === 1 && recipientName.trim()
            ? recipientName.trim()
            : undefined,
        plusOnes: parsedPlusOnes > 0 ? parsedPlusOnes : undefined,
      }));

    if (nextRecipients.length === 0) {
      setInputError('Those recipients are already on the invite list.');
      return;
    }

    setQueued(current => [...current, ...nextRecipients]);
    setEmails('');
    setRecipientName('');
    setPlusOnes('0');
    setInputError(undefined);
  }

  async function handleSendEmails() {
    const totalPending = queued.length + pendingServerInvites.length;
    if (totalPending === 0) return;

    setIsSending(true);
    try {
      if (queued.length > 0) {
        await createEmailInvites({
          eventId,
          invites: queued,
          customMessage: customMessage.trim() || undefined,
        });
      }
      const result = await sendPendingEmailInvites({ eventId });
      setQueued([]);
      setCustomMessage('');
      toast.success(
        `${result.sentCount || totalPending} email invite${totalPending === 1 ? '' : 's'} sent`
      );
    } catch {
      toast.error('Failed to send email invites');
    } finally {
      setIsSending(false);
    }
  }

  function confirmDeleteEmailInvite(invite: InviteRecord) {
    showConfirmDialog({
      title: 'Remove Email Invite',
      message: `Remove the invite for ${invite.email ?? 'this recipient'}?`,
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteInvites({ inviteIds: [invite._id] });
          toast.success('Email invite removed');
        } catch {
          toast.error('Failed to remove email invite');
        }
      },
    });
  }

  const totalPending = queued.length + pendingServerInvites.length;

  return (
    <InvitePanelScrollView>
      <InviteSectionIntro
        icon='mail-outline'
        title='Send invitations by email'
        description='Add one person or paste a comma-separated list. Groupi gives every recipient their own link.'
      />

      <Card className='gap-4'>
        <LabeledTextarea
          label='Email address or list'
          placeholder='alex@example.com, sam@example.com'
          value={emails}
          onChangeText={value => {
            setEmails(value);
            setInputError(undefined);
          }}
          error={inputError}
          numberOfLines={3}
          autoCapitalize='none'
          autoCorrect={false}
          keyboardType='email-address'
        />
        <LabeledInput
          label='Name (optional for one recipient)'
          placeholder='Alex Morgan'
          value={recipientName}
          onChangeText={setRecipientName}
        />
        <LabeledInput
          label='+1s allowed'
          value={plusOnes}
          onChangeText={value => setPlusOnes(value.replace(/[^0-9]/g, ''))}
          keyboardType='number-pad'
          helperText='Applies to everyone added from the field above.'
        />
        <Button variant='outline' onPress={handleAddRecipients}>
          <Ionicons name='person-add-outline' size={18} />
          <Text>Add to Invite List</Text>
        </Button>
      </Card>

      {queued.length > 0 || emailInvites.length > 0 ? (
        <View className='gap-2'>
          <View className='flex-row items-center gap-2'>
            <Text className='text-base font-semibold text-foreground'>
              Recipients
            </Text>
            <Badge variant='secondary'>
              <Text>{queued.length + emailInvites.length}</Text>
            </Badge>
          </View>
          {queued.map(recipient => (
            <EmailRecipientRow
              key={recipient.email}
              email={recipient.email}
              name={recipient.recipientName}
              plusOnes={recipient.plusOnes}
              status='Ready'
              onRemove={() =>
                setQueued(current =>
                  current.filter(item => item.email !== recipient.email)
                )
              }
            />
          ))}
          {emailInvites.map(invite => (
            <EmailRecipientRow
              key={invite._id}
              email={invite.email ?? 'Unknown email'}
              name={invite.recipientName}
              plusOnes={
                invite.usesTotal && invite.usesTotal > 1
                  ? invite.usesTotal - 1
                  : undefined
              }
              status={invite.emailStatus === 'sent' ? 'Sent' : 'Ready'}
              onRemove={() => confirmDeleteEmailInvite(invite)}
            />
          ))}
        </View>
      ) : null}

      <LabeledTextarea
        label='Message for this batch (optional)'
        placeholder='Add a note to the email…'
        value={customMessage}
        onChangeText={setCustomMessage}
        maxLength={MAX_EMAIL_MESSAGE_LENGTH}
        numberOfLines={4}
      />
      <Button
        onPress={handleSendEmails}
        disabled={totalPending === 0}
        isLoading={isSending}
        loadingText='Sending…'
        accessibilityLabel={`Send ${totalPending} pending email invite${totalPending === 1 ? '' : 's'}`}
      >
        <Ionicons name='send-outline' size={18} />
        <Text>
          Send {totalPending > 0 ? `${totalPending} ` : ''}Email
          {totalPending === 1 ? '' : 's'}
        </Text>
      </Button>
    </InvitePanelScrollView>
  );
}

function EmailRecipientRow({
  email,
  name,
  plusOnes,
  status,
  onRemove,
}: {
  email: string;
  name?: string;
  plusOnes?: number;
  status: 'Ready' | 'Sent';
  onRemove: () => void;
}) {
  const errorColor = String(
    useCSSVariable('--color-destructive') ?? 'transparent'
  );

  return (
    <Card className='flex-row items-center gap-3 py-3'>
      <View className='size-10 items-center justify-center rounded-full bg-muted'>
        <Ionicons
          name='mail-outline'
          size={19}
          className='accent-muted-foreground'
        />
      </View>
      <View className='flex-1'>
        {name ? (
          <Text className='font-medium text-foreground'>{name}</Text>
        ) : null}
        <Text
          className={name ? 'text-sm text-muted-foreground' : 'text-foreground'}
          numberOfLines={1}
        >
          {email}
        </Text>
        {plusOnes ? (
          <Text className='text-xs text-muted-foreground'>
            {plusOnes} +1{plusOnes === 1 ? '' : 's'}
          </Text>
        ) : null}
      </View>
      <Badge variant={status === 'Sent' ? 'success' : 'warning'}>
        <Text>{status}</Text>
      </Badge>
      <Pressable
        onPress={onRemove}
        accessibilityRole='button'
        accessibilityLabel={`Remove ${email}`}
        className='size-11 items-center justify-center rounded-full active:bg-muted'
      >
        <Ionicons name='close' size={20} color={errorColor} />
      </Pressable>
    </Card>
  );
}
