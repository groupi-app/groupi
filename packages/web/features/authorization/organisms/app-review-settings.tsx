'use client';
import { useState } from 'react';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { isAdminRole } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
const filters = [
  ['pending', 'Pending review'],
  ['reviewed', 'Reviewed'],
  ['rejected', 'Rejected'],
  ['not-requested', 'Not requested'],
] as const;
export function AppReviewSettings() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(
    api.auth.queries.getCurrentUser,
    isAuthenticated ? {} : 'skip'
  );
  if (isLoading || (isAuthenticated && user === undefined))
    return <p role='status'>Checking administrator access…</p>;
  if (!isAuthenticated || !isAdminRole(user?.role))
    return <p role='alert'>Platform administrator access required.</p>;
  return <ReviewQueue />;
}
function ReviewQueue() {
  const [filter, setFilter] = useState<(typeof filters)[number][0]>('pending');
  const apps = useQuery(api.delegatedApps.queries.listReviewableApps, {
    reviewStatus: filter,
  });
  const review = useMutation(api.delegatedApps.mutations.reviewApp);
  const [selected, setSelected] = useState<
    NonNullable<typeof apps>[number] | null
  >(null);
  const [action, setAction] =
    useState<Parameters<typeof review>[0]['status']>('approved');
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const confirmation =
    action === 'approved'
      ? 'Confirm approval'
      : action === 'rejected'
        ? 'Confirm rejection'
        : 'Confirm suspension';
  function choose(app: NonNullable<typeof apps>[number], next: typeof action) {
    setSelected(app);
    setAction(next);
    setError(null);
    setNotice(null);
  }
  async function confirm() {
    if (!selected) return;
    setPending(true);
    setError(null);
    try {
      await review({ appId: selected._id, status: action });
      setNotice(
        action === 'approved'
          ? `${selected.name} approved for wider access.`
          : action === 'rejected'
            ? `${selected.name} review rejected. Own-account testing remains available; the developer can request another review.`
            : `${selected.name} suspended. New requests and refreshes will be denied.`
      );
      setSelected(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not review app');
    } finally {
      setPending(false);
    }
  }
  return (
    <section className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold'>Developer app review</h1>
        <p className='text-muted-foreground'>
          Review purpose, client type and exact callbacks before granting wider
          eligibility. Each user still chooses whether to connect and what
          access to allow. Review is not a safety guarantee.
        </p>
      </div>
      <fieldset className='space-y-2'>
        <legend className='font-medium'>Review queue</legend>
        <div className='flex flex-wrap gap-2'>
          {filters.map(([value, label]) => (
            <Button
              key={value}
              variant={filter === value ? 'default' : 'outline'}
              aria-pressed={filter === value}
              onClick={() => {
                setFilter(value);
                setNotice(null);
              }}
            >
              {label}
            </Button>
          ))}
        </div>
      </fieldset>
      <p className='text-sm text-muted-foreground'>
        Shows up to 100 apps in the selected review state. Completing a pending
        review brings the next queued apps into view.
      </p>
      {notice ? (
        <p role='status' className='text-success'>
          {notice}
        </p>
      ) : null}
      {apps === undefined ? (
        <p role='status'>Loading app reviews…</p>
      ) : apps.length === 0 ? (
        <p>
          {filter === 'pending'
            ? 'No apps awaiting review.'
            : 'No apps in this review state.'}
        </p>
      ) : (
        apps.map(app => (
          <Card key={app._id}>
            <CardHeader>
              <CardTitle>{app.name}</CardTitle>
              <CardDescription>{app.purpose}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <dl className='space-y-2'>
                <div>
                  <dt className='text-sm text-muted-foreground'>Developer</dt>
                  <dd>{app.ownerDisplayName}</dd>
                </div>
                <div>
                  <dt className='text-sm text-muted-foreground'>Client type</dt>
                  <dd>
                    {app.clientType === 'confidential'
                      ? 'Confidential web app'
                      : 'Native app'}
                  </dd>
                </div>
                <div>
                  <dt className='text-sm text-muted-foreground'>
                    App eligibility / review
                  </dt>
                  <dd className='flex flex-wrap gap-2'>
                    <Badge variant='secondary'>{app.status}</Badge>
                    <Badge variant='outline'>{app.reviewStatus}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className='text-sm text-muted-foreground'>
                    App identifier
                  </dt>
                  <dd className='break-all text-sm'>{app._id}</dd>
                </div>
              </dl>
              <div>
                <p className='font-medium'>Exact callback URIs</p>
                <ul className='space-y-1 text-sm'>
                  {app.redirectUris.map(uri => (
                    <li key={uri} className='break-all'>
                      {uri}
                    </li>
                  ))}
                </ul>
              </div>
              <div className='flex flex-wrap gap-2'>
                {app.status !== 'approved' ? (
                  <Button onClick={() => choose(app, 'approved')}>
                    Approve {app.name}
                  </Button>
                ) : null}
                {app.reviewStatus === 'pending' ||
                app.reviewStatus === 'not-requested' ? (
                  <Button
                    variant='outline'
                    onClick={() => choose(app, 'rejected')}
                  >
                    Reject {app.name}
                  </Button>
                ) : null}
                {app.status !== 'suspended' ? (
                  <Button
                    variant='destructive'
                    onClick={() => choose(app, 'suspended')}
                  >
                    Suspend {app.name}
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))
      )}
      <Dialog
        open={selected !== null}
        onOpenChange={open => {
          if (!open && !pending) setSelected(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approved'
                ? 'Approve app for wider access?'
                : action === 'rejected'
                  ? 'Reject this review request?'
                  : 'Suspend app access?'}
            </DialogTitle>
            <DialogDescription>
              Review is not a safety guarantee. Approval changes app
              eligibility; it grants no user’s data or permissions without their
              consent. Rejection preserves own-account testing. Suspension stops
              new requests and refreshes; it does not erase previously
              downloaded data or the app’s own sessions.
            </DialogDescription>
          </DialogHeader>
          <p className='font-medium'>{selected?.name}</p>
          {error ? (
            <p role='alert' className='text-error'>
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              variant='outline'
              disabled={pending}
              onClick={() => setSelected(null)}
            >
              Cancel
            </Button>
            <Button
              variant={action === 'approved' ? 'default' : 'destructive'}
              isLoading={pending}
              onClick={() => void confirm()}
            >
              {confirmation}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
