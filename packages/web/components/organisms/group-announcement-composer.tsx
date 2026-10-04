'use client';
import { useState } from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import { announcementRequestId } from '@groupi/shared/hooks';
import {
  useAnnouncement,
  useSendAnnouncement,
} from '@/hooks/convex/use-group-announcements';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
    <section
      className='rounded-card bg-card p-4 space-y-3'
      aria-label='Group announcement'
    >
      <h2 className='font-semibold'>Announce to Group</h2>
      <p className='text-sm text-muted-foreground'>
        Send deliberately to current permitted members using their notification
        preferences.
      </p>
      <form
        className='space-y-3'
        onSubmit={async event => {
          event.preventDefault();
          const key = requestId ?? announcementRequestId();
          setRequestId(key);
          setPending(true);
          setError('');
          try {
            await send({ groupId, requestId: key, title, message });
          } catch (cause) {
            setError(
              `${cause instanceof Error ? cause.message : 'Outcome unknown.'} Retry the same request or check its status before composing another.`
            );
          } finally {
            setPending(false);
          }
        }}
      >
        <Label htmlFor='announcement-title'>Announcement title</Label>
        <Input
          id='announcement-title'
          required
          maxLength={100}
          value={title}
          disabled={Boolean(requestId)}
          onChange={event => setTitle(event.target.value)}
        />
        <Label htmlFor='announcement-message'>Announcement message</Label>
        <Textarea
          id='announcement-message'
          required
          maxLength={2000}
          value={message}
          disabled={Boolean(requestId)}
          onChange={event => setMessage(event.target.value)}
        />
        <Button
          disabled={
            pending ||
            status?.state === 'COMPLETED' ||
            status?.state === 'CANCELLED' ||
            !title.trim() ||
            !message.trim()
          }
        >
          {pending
            ? 'Submitting…'
            : requestId
              ? 'Retry same announcement'
              : 'Send announcement'}
        </Button>
      </form>
      {requestId && (
        <p className='text-sm break-all'>Request ID: {requestId}</p>
      )}
      {error && <p role='alert'>{error}</p>}
      {status && (
        <p role='status'>
          {status.state.toLowerCase()}: {status.notified} notifications created,{' '}
          {status.skipped} memberships skipped. External delivery is not
          confirmed.
        </p>
      )}
      {status && status.state !== 'PROCESSING' && (
        <Button
          variant='outline'
          onClick={() => {
            setRequestId(null);
            setTitle('');
            setMessage('');
            setError('');
          }}
        >
          Compose another announcement
        </Button>
      )}
    </section>
  );
}
