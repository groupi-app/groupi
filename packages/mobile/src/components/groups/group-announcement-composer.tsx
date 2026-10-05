import { useState } from 'react';
import { View } from 'react-native';
import type { Id } from 'convex/_generated/dataModel';
import { announcementRequestId } from '@groupi/shared/hooks';
import {
  useAnnouncement,
  useSendAnnouncement,
} from '@/hooks/use-group-announcements';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
export function GroupAnnouncementComposer({
  groupId,
}: {
  groupId: Id<'groups'>;
}) {
  const send = useSendAnnouncement();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const status = useAnnouncement(requestId ? { groupId, requestId } : 'skip');
  return (
    <View className='rounded-card bg-card p-4 gap-3'>
      <Text accessibilityRole='header' className='font-semibold'>
        Announce to Group
      </Text>
      <Text>
        Send deliberately to current permitted members using their notification
        preferences.
      </Text>
      <Input
        accessibilityLabel='Announcement title'
        placeholder='Announcement title'
        maxLength={100}
        value={title}
        editable={!requestId}
        onChangeText={setTitle}
      />
      <Input
        accessibilityLabel='Announcement message'
        placeholder='Announcement message'
        multiline
        maxLength={2000}
        value={message}
        editable={!requestId}
        onChangeText={setMessage}
      />
      <Button
        disabled={
          pending ||
          status?.state === 'COMPLETED' ||
          status?.state === 'CANCELLED' ||
          !title.trim() ||
          !message.trim()
        }
        onPress={async () => {
          const key = requestId ?? announcementRequestId();
          setRequestId(key);
          setPending(true);
          setError('');
          try {
            await send({ groupId, requestId: key, title, message });
          } catch (cause) {
            setError(
              `${cause instanceof Error ? cause.message : 'Outcome unknown.'} Retry the same request before composing another.`
            );
          } finally {
            setPending(false);
          }
        }}
      >
        <Text>
          {pending
            ? 'Submitting…'
            : requestId
              ? 'Retry same announcement'
              : 'Send announcement'}
        </Text>
      </Button>
      {requestId && <Text selectable>Request ID: {requestId}</Text>}
      {error && <Text accessibilityRole='alert'>{error}</Text>}
      {status && (
        <Text accessibilityLiveRegion='polite'>
          {status.state.toLowerCase()}: {status.notified} notifications created,{' '}
          {status.skipped} memberships skipped. External delivery is not
          confirmed.
        </Text>
      )}
      {status && status.state !== 'PROCESSING' && (
        <Button
          variant='outline'
          onPress={() => {
            setRequestId(null);
            setTitle('');
            setMessage('');
            setError('');
          }}
        >
          <Text>Compose another announcement</Text>
        </Button>
      )}
    </View>
  );
}
