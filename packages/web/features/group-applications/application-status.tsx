'use client';
import { Component, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useConvexAuth, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
class ReturnBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <p role='alert'>
        Application return unavailable. Sign in to your own account and
        reconnect the app if needed.
      </p>
    ) : (
      this.props.children
    );
  }
}
function CurrentStatus({ id }: { id: Id<'groupApplications'> }) {
  const status = useQuery(api.groupApplications.decisionDelivery.statusReturn, {
    applicationId: id,
  });
  if (!status) return <p role='status'>Loading current status…</p>;
  return (
    <>
      <h1>Application {status.status.toLowerCase()}</h1>
      <p>
        {status.currentMember
          ? 'You are currently a Group member.'
          : 'You are not currently a Group member. An earlier approval does not restore membership.'}
      </p>
      {status.url && <a href={status.url}>Continue to community status</a>}
    </>
  );
}
export default function ApplicationStatus() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { isAuthenticated, isLoading } = useConvexAuth();
  return (
    <main className='mx-auto max-w-xl space-y-4 p-6'>
      <ReturnBoundary>
        {isLoading ? (
          <p>Loading account…</p>
        ) : isAuthenticated ? (
          <CurrentStatus id={applicationId as Id<'groupApplications'>} />
        ) : (
          <>
            <h1>View your application status</h1>
            <Link
              href={`/sign-in?redirect=${encodeURIComponent(`/application-status/${applicationId}`)}`}
            >
              Sign in to continue
            </Link>
          </>
        )}
      </ReturnBoundary>
    </main>
  );
}
