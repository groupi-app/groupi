'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { InlineInviteListEditor } from './inline-invite-list-editor';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { EventInviteSearch } from '@/components/event-invite-search';
import type { InviteSearchResult } from '@/hooks/convex/use-event-invites';
import { QuerySection } from '@/components/molecules/query-section';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useInviteLists,
  useInviteList,
  useInviteListRecipientReview,
  useSendInviteListRecipients,
} from '@/hooks/convex/use-invite-lists';
import {
  mergeInviteRecipients,
  createInviteListSendAttempt,
  isDefiniteInviteListRejection,
  isExpiredInviteListRequest,
  hasInviteListRequestExpired,
} from '@groupi/shared/utils';
import type { Id } from '@/convex/_generated/dataModel';

type Person = NonNullable<ReturnType<typeof useInviteList>>['people'][number];
type ListId = NonNullable<
  ReturnType<typeof useInviteLists>
>['items'][number]['inviteListId'];
type Send = ReturnType<typeof useSendInviteListRecipients>;
type Attempt = { args: Parameters<Send>[0] };
type Result = Awaited<ReturnType<Send>>;

function ListPeople({
  id,
  add,
  back,
}: {
  id: ListId;
  add: (people: Person[]) => void;
  back: () => void;
}) {
  const list = useInviteList(id);
  if (!list) return <p role='status'>Loading invite list…</p>;
  return (
    <section className='space-y-3'>
      <h3 className='font-heading text-lg'>{list.name}</h3>
      {list.needsAttention && (
        <p role='status'>
          Needs attention. Add an existing person in Settings before using this
          list.
        </p>
      )}
      {list.people.map((person, index) => (
        <p key={index}>
          {person.available
            ? (person.name ?? person.username)
            : 'Unavailable person'}
        </p>
      ))}
      <div className='flex gap-2'>
        <Button variant='outline' onClick={back}>
          Back to lists
        </Button>
        <Button
          disabled={list.needsAttention || list.availablePersonCount === 0}
          onClick={() => {
            add(list.people);
            back();
          }}
        >
          Add {list.name}
        </Button>
      </div>
    </section>
  );
}

function ListPicker({
  add,
  create,
}: {
  add: (people: Person[]) => void;
  create: () => void;
}) {
  const lists = useInviteLists();
  const [selectedId, setSelectedId] = useState<ListId>();
  if (!lists) return <p role='status'>Loading invite lists…</p>;
  return (
    <div className='space-y-3'>
      <Button
        variant='outline'
        disabled={lists.items.length >= 100}
        onClick={create}
      >
        Create invite list
      </Button>
      {lists.items.length >= 100 && (
        <p role='status'>You have reached the limit of 100 invite lists.</p>
      )}
      {selectedId ? (
        <QuerySection message='Unable to load this invite list.'>
          <ListPeople
            id={selectedId}
            add={add}
            back={() => setSelectedId(undefined)}
          />
        </QuerySection>
      ) : (
        <section aria-label='Your invite lists' className='space-y-2'>
          <h3 className='font-heading text-lg'>Choose invite lists</h3>
          {!lists.items.length && (
            <p>No invite lists yet. Create one here or in Settings.</p>
          )}
          <p className='text-sm text-muted-foreground'>
            Add one or more lists, then review and edit the people before
            sending.
          </p>
          {lists.items.map(list => (
            <Button
              key={list.inviteListId}
              variant='outline'
              className='w-full justify-between'
              disabled={list.needsAttention}
              aria-label={`Choose ${list.name}`}
              onClick={() => setSelectedId(list.inviteListId)}
            >
              <span>{list.name}</span>
              <span>
                {list.personCount} people
                {list.needsAttention ? ' · Needs attention' : ''}
              </span>
            </Button>
          ))}
        </section>
      )}
    </div>
  );
}

function RecipientReview({
  eventId,
  people,
  remove,
  role,
  setRole,
  message,
  setMessage,
  send,
  sending,
  uncertain,
  result,
  lockedRole,
}: {
  eventId: Id<'events'>;
  people: Person[];
  remove: (personId: Person['personId']) => void;
  role: 'ATTENDEE' | 'MODERATOR';
  setRole: (role: 'ATTENDEE' | 'MODERATOR') => void;
  message: string;
  setMessage: (message: string) => void;
  send: (role: 'ATTENDEE' | 'MODERATOR') => void;
  sending: boolean;
  uncertain: boolean;
  result?: Result;
  lockedRole?: 'ATTENDEE' | 'MODERATOR';
}) {
  const review = useInviteListRecipientReview(
    eventId,
    people.map(person => person.personId)
  );
  const event = useQuery(api.events.queries.getEventHeader, { eventId });
  const canModerate = event?.userMembership.role === 'ORGANIZER';
  const effectiveRole =
    (sending || uncertain) && lockedRole
      ? lockedRole
      : canModerate
        ? role
        : 'ATTENDEE';
  if (!review || !event) return <p role='status'>Checking recipients…</p>;
  const skipText = {
    ALREADY_MEMBER: 'Already a member',
    INVITATION_PENDING: 'Invitation already pending',
    UNAVAILABLE: 'Recipient unavailable',
  };
  return (
    <section role='region' aria-label='Recipients' className='space-y-3'>
      <h3 className='font-heading text-lg'>Recipients ({people.length}/100)</h3>
      <p className='text-sm text-muted-foreground'>
        {review.eligibleCount} ready to invite. {review.skippedCount} will be
        skipped.
      </p>
      {review.results.map(person => (
        <div
          key={person.personId}
          className='rounded-card border border-border bg-card p-3 flex items-center gap-3'
        >
          <div className='flex-1'>
            <p>
              {person.available
                ? (person.name ?? person.username)
                : 'Unavailable person'}
            </p>
            {person.available && person.username && (
              <p className='text-sm text-muted-foreground'>
                @{person.username}
              </p>
            )}
            {person.status === 'skipped' && (
              <p className='text-sm text-muted-foreground'>
                {skipText[person.reason]}
              </p>
            )}
          </div>
          <Button
            variant='ghost'
            disabled={sending || uncertain}
            aria-label={`Remove ${person.available ? (person.name ?? person.username) : 'unavailable person'}`}
            onClick={() => remove(person.personId)}
          >
            Remove
          </Button>
        </div>
      ))}
      <fieldset disabled={sending || uncertain} className='space-y-3'>
        <div className='space-y-2'>
          <Label htmlFor='list-invite-role'>Invite as</Label>
          <Select
            value={effectiveRole}
            onValueChange={value => setRole(value as 'ATTENDEE' | 'MODERATOR')}
            disabled={sending || uncertain}
          >
            <SelectTrigger id='list-invite-role'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ATTENDEE'>Attendee</SelectItem>
              {(canModerate ||
                ((sending || uncertain) && effectiveRole === 'MODERATOR')) && (
                <SelectItem value='MODERATOR'>Moderator</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='list-invite-message'>Message (optional)</Label>
          <Textarea
            id='list-invite-message'
            value={message}
            onChange={event => setMessage(event.target.value)}
            maxLength={280}
            aria-describedby='list-message-limit'
          />
          <p id='list-message-limit' className='text-sm text-muted-foreground'>
            {message.length}/280
          </p>
          {message.length > 280 && (
            <p role='alert' className='text-error'>
              Use a message with at most 280 characters.
            </p>
          )}
        </div>
      </fieldset>
      {!uncertain && (
        <Button
          onClick={() => send(effectiveRole)}
          disabled={sending || message.length > 280}
          isLoading={sending}
          loadingText='Sending invitations…'
        >
          Send invitations
        </Button>
      )}
      {result && (
        <section aria-label='Invitation results' className='space-y-2'>
          {result.results.map(outcome => {
            const person = review.results.find(
              person => person.personId === outcome.personId
            );
            const label =
              outcome.status === 'skipped' && outcome.reason === 'UNAVAILABLE'
                ? 'Recipient unavailable'
                : person?.available
                  ? (person.name ?? person.username)
                  : 'Unavailable person';
            return (
              <p key={outcome.personId}>
                {label}:{' '}
                {outcome.status === 'sent'
                  ? 'Invitation sent'
                  : skipText[outcome.reason]}
              </p>
            );
          })}
        </section>
      )}
    </section>
  );
}

/** One mounted panel owns the copied recipient draft across both invitation tabs. */
export function EventPeopleInvite({
  eventId,
  source,
  onProtectedChange,
  registerEditorDismiss,
  onInspectPending,
}: {
  eventId: Id<'events'>;
  source: 'username' | 'list';
  onProtectedChange: (protectedSend: boolean) => void;
  registerEditorDismiss: (dismiss: (() => void) | undefined) => void;
  onInspectPending: () => void;
}) {
  const sendRecipients = useSendInviteListRecipients();
  const [manual, setManual] = useState<InviteSearchResult | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [bulk, setBulk] = useState(false);
  const [role, setRole] = useState<'ATTENDEE' | 'MODERATOR'>('ATTENDEE');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [expired, setExpired] = useState(false);
  const [expiryEstimated, setExpiryEstimated] = useState(false);
  const [expiryAcknowledged, setExpiryAcknowledged] = useState(false);
  const [attempt, setAttempt] = useState<Attempt>();
  const [result, setResult] = useState<Result>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [savedList, setSavedList] = useState(false);
  const editorOpener = useRef<HTMLElement | null>(null);
  const expiryHeading = useRef<HTMLHeadingElement>(null);
  const draftRegion = useRef<HTMLDivElement>(null);
  const wasExpired = useRef(false);
  useLayoutEffect(() => {
    if (!editorOpen) editorOpener.current?.focus();
  }, [editorOpen]);
  useEffect(() => {
    onProtectedChange(sending || uncertain);
  }, [sending, uncertain, onProtectedChange]);
  useLayoutEffect(() => {
    if (expired) expiryHeading.current?.focus();
    else if (wasExpired.current) {
      const messageInput = draftRegion.current?.querySelector<HTMLElement>(
        '#list-invite-message'
      );
      (messageInput ?? draftRegion.current)?.focus();
    }
    wasExpired.current = expired;
  }, [expired]);

  function add(added: Person[]) {
    try {
      const current = bulk
        ? people
        : manual
          ? [{ ...manual, available: true }]
          : [];
      setPeople(mergeInviteRecipients(current, added));
      setBulk(true);
      setError('');
      setResult(undefined);
    } catch (failure) {
      setError(
        failure instanceof RangeError
          ? failure.message
          : 'Unable to add people.'
      );
    }
  }

  async function send(sendRole: 'ATTENDEE' | 'MODERATOR') {
    if (sending || expired) return;
    const original =
      attempt ??
      createInviteListSendAttempt(
        {
          eventId,
          personIds: people.map(person => person.personId),
          role: sendRole,
          message: message.trim() || undefined,
        },
        () => crypto.randomUUID()
      );
    setAttempt(original);
    onProtectedChange(true);
    setSending(true);
    setError('');
    setResult(undefined);
    try {
      const outcome = await sendRecipients(original.args);
      setResult(outcome);
      setAttempt(undefined);
      setUncertain(false);
    } catch (failure) {
      const serverExpired = isExpiredInviteListRequest(failure);
      if (
        serverExpired ||
        (uncertain && hasInviteListRequestExpired(original.args.requestId))
      ) {
        setUncertain(true);
        setExpired(true);
        setExpiryEstimated(!serverExpired);
        setExpiryAcknowledged(false);
      } else if (!uncertain && isDefiniteInviteListRejection(failure)) {
        setAttempt(undefined);
        setError(
          'No invitations were sent. Check your selection and permissions, then try again.'
        );
      } else {
        setUncertain(true);
        setError(
          'The send outcome is uncertain. Retry the original send to recover its result without duplicate invitations. Your original recipients, role, and message are preserved.'
        );
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      ref={draftRegion}
      tabIndex={-1}
      role='region'
      aria-label='Invitation draft'
      className='space-y-4'
    >
      <div hidden={editorOpen} className='space-y-4'>
        {savedList && (
          <p role='status'>List saved. No invitations were sent.</p>
        )}
        <fieldset disabled={sending || uncertain}>
          <div hidden={source !== 'username'}>
            <QuerySection message='Unable to load people for this event.'>
              <EventInviteSearch
                eventId={eventId}
                onSelectionChange={setManual}
                onRoleChange={setRole}
                onMessageChange={setMessage}
                onAddRecipient={
                  bulk
                    ? person => add([{ ...person, available: true }])
                    : undefined
                }
              />
            </QuerySection>
          </div>
          <div hidden={source !== 'list'}>
            <QuerySection message='Unable to load your invite lists.'>
              <ListPicker
                add={add}
                create={() => {
                  editorOpener.current = document.activeElement as HTMLElement;
                  setSavedList(false);
                  setEditorOpen(true);
                }}
              />
            </QuerySection>
          </div>
        </fieldset>
        {error && (
          <p role='alert' className='text-error'>
            {error}
          </p>
        )}
        {uncertain && !expired && (
          <Button
            onClick={() => send(attempt?.args.role ?? 'ATTENDEE')}
            disabled={sending}
            isLoading={sending}
            loadingText='Recovering send result…'
          >
            Retry original send
          </Button>
        )}
        {expired && attempt && (
          <section
            aria-labelledby='expired-invite-request-title'
            className='space-y-3 rounded-card border border-border p-4'
          >
            <h3
              id='expired-invite-request-title'
              ref={expiryHeading}
              tabIndex={-1}
              className='font-heading text-lg'
            >
              {expiryEstimated
                ? 'Request protection may have expired'
                : 'Original request expired'}
            </h3>
            <p role='alert'>
              {expiryEstimated
                ? "Based on this device's clock, request protection may have expired. Some invitations may already have been sent. Inspect pending invitations before starting a new review."
                : 'Some invitations may already have been sent. This request ID can no longer be retried. Inspect pending invitations before starting a new review.'}
            </p>
            <p className='break-all'>
              Original request ID: <code>{attempt.args.requestId}</code>
            </p>
            <p>
              {attempt.args.personIds.length} original recipients ·{' '}
              {attempt.args.role === 'MODERATOR' ? 'Moderator' : 'Attendee'}
            </p>
            <p>Original message: {attempt.args.message ?? 'No message'}</p>
            <Button variant='outline' onClick={onInspectPending}>
              Inspect pending invitations
            </Button>
            <Label
              htmlFor='expired-invite-acknowledge'
              className='flex items-start gap-2'
            >
              <Checkbox
                id='expired-invite-acknowledge'
                checked={expiryAcknowledged}
                onCheckedChange={value => setExpiryAcknowledged(value === true)}
              />
              <span>
                I understand the original send may have completed and will
                review pending invitations before sending again.
              </span>
            </Label>
            <p className='text-sm text-muted-foreground'>
              Starting a new review keeps your recipients, role, and message. It
              does not send invitations.
            </p>
            <Button
              disabled={!expiryAcknowledged}
              onClick={() => {
                if (!expiryAcknowledged) return;
                setAttempt(undefined);
                setExpired(false);
                setExpiryEstimated(false);
                setUncertain(false);
                setExpiryAcknowledged(false);
                setError('');
                onProtectedChange(false);
              }}
            >
              Start a new review
            </Button>
          </section>
        )}
        {result && (
          <p role='status'>
            {result.sentCount === 0
              ? `No invitations were sent. ${result.skippedCount} skipped.`
              : `${result.sentCount} ${result.sentCount === 1 ? 'invitation' : 'invitations'} sent. ${result.skippedCount} skipped.`}
          </p>
        )}
        {bulk && people.length > 0 && (
          <QuerySection message='Unable to check recipients. Your selection is preserved.'>
            <RecipientReview
              eventId={eventId}
              people={people}
              remove={id => {
                setPeople(people.filter(person => person.personId !== id));
                setResult(undefined);
              }}
              role={role}
              setRole={setRole}
              message={message}
              setMessage={setMessage}
              send={send}
              sending={sending}
              uncertain={uncertain}
              result={result}
              lockedRole={attempt?.args.role}
            />
          </QuerySection>
        )}
        {bulk && people.length === 0 && (
          <p role='status'>Choose at least one recipient before sending.</p>
        )}
      </div>
      {editorOpen && (
        <InlineInviteListEditor
          registerDismiss={registerEditorDismiss}
          finish={(detail, use) => {
            if (detail) {
              setSavedList(true);
              if (use) add(detail.people);
            }
            setEditorOpen(false);
          }}
        />
      )}
    </div>
  );
}
