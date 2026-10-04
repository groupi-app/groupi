'use client';
import { Component, useState, type ReactNode } from 'react';
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
      <p role='alert'>
        Applications are unavailable or you do not have permission to view them.
      </p>
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
      <h1 className='text-2xl font-semibold'>Apply for approval</h1>
      <p>
        Your answers are private to you and authorized Event reviewers. Approval
        admits you as an Attendee with a Pending RSVP; no second acceptance is
        needed.
      </p>
      {form.canApply || form.pending ? (
        <ApplicantForm
          key={form.pending?._id ?? JSON.stringify(form.settings.questions)}
          eventId={eventId}
          pending={form.pending}
          questions={form.pending?.questions ?? form.settings.questions}
          canApply={form.canApply}
        />
      ) : (
        <p role='status'>You cannot apply to this Event at this time.</p>
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
      <h2 className='text-xl font-semibold'>
        {review ? 'Review applications' : 'Your application history'}
      </h2>
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
          <div className='flex gap-3'>
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
    applicant?: { name: string | null; username: string | null };
  };
  review: boolean;
}) {
  const decide = useDecideApplication();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function decision(status: 'APPROVED' | 'DECLINED') {
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
      className='rounded-card border border-border p-4 space-y-3'
      aria-label={
        review
          ? `Application from ${application.applicant?.name || application.applicant?.username || 'Applicant'}`
          : 'Your application'
      }
    >
      <h3 className='font-semibold'>{application.status}</h3>
      {review && (
        <p>
          Applicant:{' '}
          {application.applicant?.name ||
            application.applicant?.username ||
            'Applicant'}
        </p>
      )}
      <dl className='space-y-2'>
        {application.questions.map(q => (
          <div key={q.id}>
            <dt className='font-medium'>{q.label}</dt>
            <dd>
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
          <Label htmlFor={`decision-${application._id}`}>
            Decision reason (optional)
          </Label>
          <Textarea
            id={`decision-${application._id}`}
            value={reason}
            maxLength={2000}
            disabled={busy}
            onChange={event => setReason(event.target.value)}
          />
          <div className='flex gap-3'>
            <Button
              disabled={busy || !!message}
              onClick={() => void decision('APPROVED')}
            >
              Approve application
            </Button>
            <Button
              variant='outline'
              disabled={busy || !!message}
              onClick={() => void decision('DECLINED')}
            >
              Decline application
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
