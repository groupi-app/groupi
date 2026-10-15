'use client';
import { Component, type ReactNode, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <p role='alert'>
        Preferences unavailable. Sign in to your own account and reconnect if
        needed.
      </p>
    ) : (
      this.props.children
    );
  }
}
function Preferences({ groupId }: { groupId: Id<'groups'> }) {
  const current = useQuery(api.groupAnnouncements.eventMail.preferenceReturn, {
    groupId,
  });
  const update = useMutation(api.groups.announcementPreferences.updateOwn);
  const [intent, setIntent] = useState<{
    groupId: Id<'groups'>;
    subscribed: boolean;
    operationId: string;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  if (!current) return <p role='status'>Loading your preferences…</p>;
  return (
    <>
      <h1>{current.groupName} announcement preferences</h1>
      <p>
        {current.subscribed
          ? 'You opted into Group Event announcements.'
          : 'You are not subscribed to Group Event announcements.'}{' '}
        Global notification settings and Do Not Disturb still apply. Only
        current eligible members receive email.
      </p>
      <Button
        disabled={pending}
        onClick={async () => {
          const next = intent ?? {
            groupId,
            subscribed: !current.subscribed,
            operationId: crypto.randomUUID(),
          };
          setIntent(next);
          setPending(true);
          setError('');
          try {
            await update(next);
            setIntent(null);
          } catch (cause) {
            setError(
              `${cause instanceof Error ? cause.message : 'Outcome unknown.'} Retry the same preference change.`
            );
          } finally {
            setPending(false);
          }
        }}
      >
        {intent
          ? 'Retry same preference change'
          : current.subscribed
            ? 'Unsubscribe'
            : 'Subscribe to Event announcements'}
      </Button>
      {error && <p role='alert'>{error}</p>}
      {current.url && <a href={current.url}>Continue to community</a>}
    </>
  );
}
export default function AnnouncementPreferences() {
  const { groupId } = useParams<{ groupId: string }>();
  const auth = useConvexAuth();
  return (
    <main className='mx-auto max-w-xl space-y-4 p-6'>
      <Boundary>
        {auth.isLoading ? (
          <p>Loading account…</p>
        ) : auth.isAuthenticated ? (
          <Preferences groupId={groupId as Id<'groups'>} />
        ) : (
          <Link
            href={`/sign-in?redirect=${encodeURIComponent(`/announcement-preferences/${groupId}`)}`}
          >
            Sign in to your own account
          </Link>
        )}
      </Boundary>
    </main>
  );
}
