'use client';
import { Component, useState, type ReactNode } from 'react';
import Link from 'next/link';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import type { ApplicationAnswers } from '@groupi/shared/hooks';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  useGroupApplicationForm,
  useMyGroupApplications,
  useGroupApplications,
  useSubmitGroupApplication,
  useEditGroupApplication,
  useWithdrawGroupApplication,
  useReviewGroupApplication,
} from '@/hooks/convex/use-group-applications';
import { ApplicationQuestionFields } from './application-question-fields';
import { GroupPagination } from './group-pagination';
class ApplicationsBoundary extends Component<
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
        Group applications are unavailable or you no longer have permission to
        view them.
      </p>
    ) : (
      this.props.children
    );
  }
}
export function GroupApplications({
  groupId,
  review = false,
}: {
  groupId: Id<'groups'>;
  review?: boolean;
}) {
  return (
    <ApplicationsBoundary key={`${groupId}-${review}`}>
      <ApplicationContent groupId={groupId} review={review} />
    </ApplicationsBoundary>
  );
}
function ApplicationContent({
  groupId,
  review,
}: {
  groupId: Id<'groups'>;
  review: boolean;
}) {
  const form = useGroupApplicationForm({ groupId });
  if (form === undefined)
    return <p role='status'>Loading Group applications…</p>;
  if (review)
    return form.canReview ? (
      <ApplicationRecords groupId={groupId} review />
    ) : (
      <p role='alert'>
        Only the current Group owner and moderators can review applications.
      </p>
    );
  return (
    <section
      id='group-applications'
      className='space-y-4'
      aria-labelledby='group-apply-heading'
    >
      <h2 id='group-apply-heading' className='text-xl font-semibold'>
        Apply to join this Group
      </h2>
      <p>
        Your answers and history are private to you and the current Group owner
        and moderators. Approval admits you immediately; it does not join Events
        or create friendships.
      </p>
      {form.canApply || form.pending ? (
        <ApplicantForm
          key={form.pending?._id ?? JSON.stringify(form.questions)}
          groupId={groupId}
          pending={form.pending}
          questions={form.pending?.questions ?? form.questions}
          canApply={form.canApply}
        />
      ) : (
        <p role='status'>
          {form.applicationsEnabled
            ? 'You cannot apply to this Group at this time.'
            : 'This Group is not accepting applications. Manager invitations remain available.'}
        </p>
      )}
      <ApplicationRecords groupId={groupId} review={false} />
    </section>
  );
}
function ApplicantForm({
  groupId,
  pending,
  questions,
  canApply,
}: {
  groupId: Id<'groups'>;
  pending: Doc<'groupApplications'> | null;
  questions: Doc<'groupApplications'>['questions'];
  canApply: boolean;
}) {
  const submit = useSubmitGroupApplication();
  const edit = useEditGroupApplication();
  const withdraw = useWithdrawGroupApplication();
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
          () =>
            pending
              ? edit({ applicationId: pending._id, answers })
              : submit({ groupId, answers }),
          pending ? 'Application updated.' : 'Application submitted for review.'
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
      <div className='flex flex-wrap gap-3'>
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
          You can withdraw your pending application, but applications are
          unavailable for submission or editing.
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
  groupId,
  review,
}: {
  groupId: Id<'groups'>;
  review: boolean;
}) {
  const [cursor, setCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<
    Doc<'groupApplications'>['status'] | 'ALL'
  >('PENDING');
  const args = { groupId, paginationOpts: { cursor, numItems: 20 } };
  const history = useMyGroupApplications(review ? 'skip' : args);
  const queue = useGroupApplications(
    review ? { ...args, ...(status === 'ALL' ? {} : { status }) } : 'skip'
  );
  const records = review ? queue : history;
  return (
    <section
      id={review ? 'group-applications' : undefined}
      className='space-y-4'
      aria-label={
        review
          ? 'Group application review queue'
          : 'Your Group application history'
      }
    >
      <h2 className='text-xl font-semibold'>
        {review ? 'Review Group applications' : 'Your application history'}
      </h2>
      {review && (
        <>
          <p>
            Approval immediately admits the applicant as a Group member. No
            second acceptance is needed.
          </p>
          <Label htmlFor='group-application-status'>Application status</Label>
          <select
            id='group-application-status'
            className='w-full rounded-input border border-input bg-background p-2 text-foreground'
            value={status}
            onChange={event => {
              setStatus(event.target.value as typeof status);
              setCursor(null);
            }}
          >
            {(
              ['PENDING', 'APPROVED', 'DECLINED', 'WITHDRAWN', 'ALL'] as const
            ).map(value => (
              <option key={value} value={value}>
                {value === 'ALL' ? 'All statuses' : value.toLowerCase()}
              </option>
            ))}
          </select>
        </>
      )}
      {records === undefined ? (
        <p role='status'>Loading application records…</p>
      ) : (
        <>
          {records.page.length === 0 && <p>No applications on this page.</p>}
          {review
            ? queue?.page.map(application => (
                <ApplicationRecord
                  key={`${application._id}-${application.updatedAt}`}
                  application={application}
                  review
                  applicantName={
                    application.applicant.name ??
                    application.applicant.username ??
                    application.applicant.personId
                  }
                />
              ))
            : history?.page.map(application => (
                <ApplicationRecord
                  key={`${application._id}-${application.updatedAt}`}
                  application={application}
                  review={false}
                />
              ))}
          <GroupPagination
            cursor={cursor}
            onCursor={setCursor}
            page={records}
            label='applications'
          />
        </>
      )}
    </section>
  );
}
function ApplicationRecord({
  application,
  review,
  applicantName,
}: {
  application: Doc<'groupApplications'>;
  review: boolean;
  applicantName?: string;
}) {
  const decide = useReviewGroupApplication();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function decision(value: 'APPROVED' | 'DECLINED') {
    setBusy(true);
    setError('');
    try {
      await decide({ applicationId: application._id, decision: value });
      setMessage(
        value === 'APPROVED'
          ? 'Approved. The applicant is now a Group member.'
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
      aria-label={`Application ${application._id}`}
    >
      <h3 className='font-semibold'>{application.status}</h3>
      {review && <p>Applicant: {applicantName ?? application.personId}</p>}
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
          {item.status} by {item.actorId ?? 'Deleted account'} on{' '}
          {new Date(item.at).toLocaleString()}
        </p>
      ))}
      {application.status === 'APPROVED' && (
        <>
          <p>
            {review
              ? 'The applicant was admitted as a Group member.'
              : 'You were admitted as a Group member. No second acceptance is needed.'}
          </p>
          <Button asChild>
            <Link href={`/groups/${application.groupId}`}>Open Group</Link>
          </Button>
        </>
      )}
      {review && application.status === 'PENDING' && (
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
