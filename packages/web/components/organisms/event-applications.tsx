'use client';
import {
  Component,
  lazy,
  Suspense,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Check, UserRound, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { UserInfoCard } from '@/components/molecules/user-info-card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';
import type { Id, Doc } from '@/convex/_generated/dataModel';
import type { ApplicationAnswers } from '@groupi/shared/hooks';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  useApplicationForm,
  useApplicationHistory,
  useApplicationReviewQueue,
  useSubmitApplication,
  useWithdrawApplication,
  useDecideApplication,
} from '@/hooks/convex/use-event-applications';
import { ApplicationQuestionFields } from './application-question-fields';

const ProfileView = lazy(() =>
  import('@/components/profile-view-dialog').then(module => ({
    default: module.ProfileViewDialog,
  }))
);

class ApplicantProfileBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function ApplicantProfileLookup({
  personId,
  onClose,
}: {
  personId: Id<'persons'>;
  onClose: () => void;
}) {
  const profile = useQuery(api.users.queries.getUserProfile, { personId });
  return profile ? (
    <Suspense
      fallback={
        <ApplicantProfileNotice onClose={onClose}>
          Loading profile…
        </ApplicantProfileNotice>
      }
    >
      <ProfileView
        userId={profile.user.id}
        open
        onOpenChange={open => {
          if (!open) onClose();
        }}
      />
    </Suspense>
  ) : (
    <ApplicantProfileNotice onClose={onClose}>
      Loading profile…
    </ApplicantProfileNotice>
  );
}

function ApplicantProfileNotice({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <Dialog
      open
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>
        <DialogDescription role='status'>{children}</DialogDescription>
      </DialogContent>
    </Dialog>
  );
}

function ApplicantIdentity({
  applicant,
  personId,
}: {
  applicant?: {
    name: string | null;
    username: string | null;
    image?: string | null;
  };
  personId: Id<'persons'>;
}) {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const name = applicant?.name || applicant?.username || 'Applicant';
  const info = (
    <UserInfoCard
      name={name}
      subtitle={applicant?.username ? `@${applicant.username}` : undefined}
      avatar={{
        src: applicant?.image,
        fallback: name.slice(0, 2).toUpperCase(),
      }}
      className='min-w-0 [&_.truncate]:whitespace-normal [&_.truncate]:break-words [&_.truncate]:overflow-visible'
    />
  );
  const closeProfile = () => {
    setProfileOpen(false);
    requestAnimationFrame(() => trigger.current?.focus());
  };
  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type='button'
            ref={trigger}
            aria-label={`Profile options for ${name}`}
            className='w-full min-w-0 flex-1 rounded-input text-left focus-visible:outline-2 focus-visible:outline-ring'
          >
            {info}
          </button>
        </PopoverTrigger>
        <PopoverContent align='start' className='space-y-3'>
          {info}
          <Button
            type='button'
            variant='ghost'
            className='w-full justify-start'
            icon={<UserRound className='size-4' aria-hidden='true' />}
            onClick={() => {
              setOpen(false);
              setProfileOpen(true);
            }}
          >
            View profile
          </Button>
        </PopoverContent>
      </Popover>
      {profileOpen && (
        <ApplicantProfileBoundary
          fallback={
            <ApplicantProfileNotice onClose={closeProfile}>
              Profile unavailable.
            </ApplicantProfileNotice>
          }
        >
          <ApplicantProfileLookup personId={personId} onClose={closeProfile} />
        </ApplicantProfileBoundary>
      )}
    </>
  );
}

class ApplicationBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className='space-y-3'>
        <p role='alert'>
          Applications are unavailable or you do not have permission to view
          them.
        </p>
        <Button
          variant='outline'
          onClick={() => this.setState({ failed: false })}
        >
          Retry applications
        </Button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export function EventApplications({
  eventId,
  review = false,
}: {
  eventId: Id<'events'>;
  review?: boolean;
}) {
  return (
    <ApplicationBoundary key={`${eventId}-${review}`}>
      <ApplicationContent eventId={eventId} review={review} />
    </ApplicationBoundary>
  );
}
function ApplicationContent({
  eventId,
  review,
}: {
  eventId: Id<'events'>;
  review: boolean;
}) {
  const form = useApplicationForm({ eventId });
  if (form === undefined) return <p role='status'>Loading applications…</p>;
  if (review)
    return form.canReview ? (
      <ApplicationRecords eventId={eventId} review />
    ) : (
      <p role='alert'>
        Only authorized Event reviewers can review applications.
      </p>
    );
  return (
    <section className='space-y-6'>
      <h1 className='font-heading text-2xl font-semibold'>
        Apply for approval
      </h1>
      <p>
        Your answers are private to you and authorized Event reviewers. Approval
        admits you as an Attendee with a Pending RSVP; no second acceptance is
        needed. Current audience eligibility, including required Group
        onboarding, is checked at submission and approval. Group managers do not
        gain Event review authority.
      </p>
      {form.canApply || form.pending ? (
        <ApplicantForm
          key={
            form.pending?._id ?? JSON.stringify(form.settings?.questions ?? [])
          }
          eventId={eventId}
          pending={form.pending}
          questions={form.pending?.questions ?? form.settings?.questions ?? []}
          canApply={form.canApply}
        />
      ) : (
        <p role='status'>
          You cannot apply to this Event at this time. Your private history
          remains available below. Restore a qualifying audience to apply again.
        </p>
      )}
      <ApplicationRecords eventId={eventId} review={false} />
    </section>
  );
}
function ApplicantForm({
  eventId,
  pending,
  questions,
  canApply,
}: {
  eventId: Id<'events'>;
  pending: Doc<'eventApplications'> | null;
  questions: Doc<'eventApplications'>['questions'];
  canApply: boolean;
}) {
  const submit = useSubmitApplication();
  const withdraw = useWithdrawApplication();
  const [answers, setAnswers] = useState<ApplicationAnswers>(
    pending?.answers ?? {}
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
      setMessage(success);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to update application. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className='rounded-card border border-border p-4 space-y-4'
      onSubmit={event => {
        event.preventDefault();
        void run(
          () => submit({ eventId, answers }),
          'Application submitted for review.'
        );
      }}
    >
      {pending && <p role='status'>Application pending review</p>}
      <ApplicationQuestionFields
        questions={questions}
        answers={answers}
        onChange={setAnswers}
        disabled={busy || !canApply}
      />
      <div className='flex gap-3 flex-wrap'>
        <Button disabled={busy || !canApply}>
          {busy
            ? 'Saving…'
            : pending
              ? 'Save application'
              : 'Submit application'}
        </Button>
        {pending && (
          <Button
            type='button'
            variant='outline'
            disabled={busy}
            onClick={() =>
              void run(
                () => withdraw({ applicationId: pending._id }),
                'Application withdrawn.'
              )
            }
          >
            Withdraw application
          </Button>
        )}
      </div>
      {!canApply && (
        <p>
          You can withdraw your pending application, but you are no longer
          eligible to submit or edit it.
        </p>
      )}
      {message && <p role='status'>{message}</p>}
      {error && (
        <p role='alert' className='text-error'>
          {error}
        </p>
      )}
    </form>
  );
}
function ApplicationRecords({
  eventId,
  review,
}: {
  eventId: Id<'events'>;
  review: boolean;
}) {
  const [cursor, setCursor] = useState<string | null>(null);
  const args = { eventId, paginationOpts: { cursor, numItems: 20 } };
  const history = useApplicationHistory(review ? 'skip' : args);
  const queue = useApplicationReviewQueue(review ? args : 'skip');
  const records = review ? queue : history;
  return (
    <section
      className='space-y-4'
      aria-label={
        review ? 'Application review queue' : 'Your application history'
      }
    >
      {!review && (
        <h2 className='font-heading text-xl font-semibold'>
          Your application history
        </h2>
      )}
      {records === undefined ? (
        <p role='status'>Loading application records…</p>
      ) : (
        <>
          {records.page.length === 0 && <p>No applications on this page.</p>}
          {records.page.map(application => (
            <ApplicationRecord
              key={application._id}
              application={application}
              review={review}
            />
          ))}
          <div className='flex flex-wrap gap-2'>
            {cursor !== null && (
              <Button variant='outline' onClick={() => setCursor(null)}>
                First page
              </Button>
            )}
            {!records.isDone && (
              <Button
                variant='outline'
                onClick={() => setCursor(records.continueCursor)}
              >
                Next page
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
function ApplicationRecord({
  application,
  review,
}: {
  application: Doc<'eventApplications'> & {
    applicant?: {
      name: string | null;
      username: string | null;
      image?: string | null;
    };
  };
  review: boolean;
}) {
  const decide = useDecideApplication();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function decision(status: 'APPROVED' | 'DECLINED') {
    if (busy || message) return;
    setBusy(true);
    setError('');
    try {
      await decide({
        applicationId: application._id,
        decision: status,
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      });
      setMessage(
        status === 'APPROVED'
          ? 'Approved as Attendee with Pending RSVP.'
          : 'Application declined.'
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to review application.'
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <article
      className='min-w-0 rounded-card border border-border bg-card p-4 space-y-4'
      aria-label={
        review
          ? `Application from ${application.applicant?.name || application.applicant?.username || 'Applicant'}`
          : 'Your application'
      }
    >
      {review ? (
        <header className='flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:gap-3'>
          <ApplicantIdentity
            applicant={application.applicant}
            personId={application.personId}
          />
          <Badge
            variant={
              application.status === 'APPROVED'
                ? 'success'
                : application.status === 'PENDING'
                  ? 'warning'
                  : application.status === 'DECLINED'
                    ? 'destructive'
                    : 'outline'
            }
            className='shrink-0'
          >
            {application.status.charAt(0) +
              application.status.slice(1).toLowerCase()}
          </Badge>
        </header>
      ) : (
        <h3 className='font-heading font-semibold'>{application.status}</h3>
      )}
      <dl className={review ? 'divide-y divide-border' : 'space-y-2'}>
        {application.questions.map(q => (
          <div
            key={q.id}
            className={review ? 'min-w-0 py-3 first:pt-0 last:pb-0' : undefined}
          >
            <dt className='break-words text-sm font-medium text-muted-foreground'>
              {q.label}
            </dt>
            <dd className='mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed'>
              {Array.isArray(application.answers[q.id])
                ? (application.answers[q.id] as string[]).join(', ')
                : typeof application.answers[q.id] === 'boolean'
                  ? application.answers[q.id]
                    ? 'Yes'
                    : 'No'
                  : String(application.answers[q.id] ?? 'No answer')}
            </dd>
          </div>
        ))}
      </dl>
      {application.decisions.map((item, index) => (
        <p key={index}>
          {item.status}
          {item.reason ? `: ${item.reason}` : ''}
        </p>
      ))}
      {application.status === 'APPROVED' && (
        <>
          <p>
            {review
              ? 'Applicant admitted as an Attendee with a Pending RSVP.'
              : 'You are an Attendee with a Pending RSVP. Confirm attendance in the Event.'}
          </p>
          <Link
            className='text-primary underline'
            href={`/event/${application.eventId}`}
          >
            Open Event
          </Link>
        </>
      )}
      {review && application.status === 'PENDING' && (
        <>
          <div className='space-y-2 border-t border-border pt-4'>
            <Label htmlFor={`decision-${application._id}`}>
              Decision reason (optional)
            </Label>
            <Textarea
              id={`decision-${application._id}`}
              rows={2}
              className='field-sizing-content'
              value={reason}
              maxLength={2000}
              disabled={busy}
              onChange={event => setReason(event.target.value)}
            />
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              aria-label='Approve application'
              icon={<Check className='size-4' aria-hidden='true' />}
              disabled={busy || !!message}
              onClick={() => void decision('APPROVED')}
            >
              Approve
            </Button>
            <Button
              variant='outline'
              aria-label='Decline application'
              icon={<X className='size-4' aria-hidden='true' />}
              disabled={busy || !!message}
              onClick={() => void decision('DECLINED')}
            >
              Decline
            </Button>
          </div>
        </>
      )}
      {message && <p role='status'>{message}</p>}
      {error && (
        <p role='alert' className='text-error'>
          {error}
        </p>
      )}
    </article>
  );
}
