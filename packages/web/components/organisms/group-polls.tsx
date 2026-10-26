'use client';
import { MoreHorizontal } from 'lucide-react';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';

import {
  useToolOwner as useGroup,
  useContentBase,
  type ContentOwnerId,
} from '@/features/content/tool-scope';
import {
  usePoll,
  usePollManagement,
  usePolls,
  usePollHistory,
  usePollResults,
  usePollPolicy,
  useConfigurePollPolicy,
  useCreatePoll,
  useConfigurePoll,
  useSubmitPollVote,
  useRemovePollVote,
  useRemovePollResult,
  useDeletePoll,
} from '@/hooks/convex/use-group-polls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ContentPage,
  ContentKind,
  ContentSettings,
} from '@/features/content/content-design';
import { Label } from '@/components/ui/label';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { GroupConfirmedAction } from './group-confirmed-action';
const pollCardClass =
  'w-full min-w-0 max-w-md space-y-3 rounded-card border border-border bg-card p-4 text-foreground';
const pollChoiceClass =
  'flex min-h-11 min-w-0 items-center justify-between gap-3 rounded-input border border-transparent bg-bg-sunken px-3 py-2 text-sm leading-snug has-[:checked]:border-primary has-[:checked]:bg-primary/5 focus-within:ring-2 focus-within:ring-ring';
const failure = (error: unknown) =>
  error instanceof Error
    ? error.message
    : 'Operation failed. Inspect current state before repeating.';
export function GroupPolls({ groupId }: { groupId: ContentOwnerId }) {
  const base = useContentBase(groupId);
  const group = useGroup(groupId);
  const policy = usePollPolicy({ groupId });
  const setPolicy = useConfigurePollPolicy();
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [policyBusy, setPolicyBusy] = useState(false);
  async function savePolicy(
    enabled: boolean,
    creation: 'MANAGERS' | 'MEMBERS'
  ) {
    setPolicyBusy(true);
    setError('');
    try {
      await setPolicy({ groupId, enabled, creation });
    } catch (error) {
      setError(failure(error));
    } finally {
      setPolicyBusy(false);
    }
  }
  const canAccess =
    group && group.joiningQuestionnaire?.canAccessMemberContent !== false;
  const canManage =
    group?.viewerRole === 'OWNER' || group?.viewerRole === 'MODERATOR';
  const polls = usePolls(
    canAccess && (policy?.enabled || canManage)
      ? { groupId, paginationOpts: { numItems: 20, cursor } }
      : 'skip'
  );
  if (!group || !policy) return <p role='status'>Loading polls…</p>;
  return (
    <ContentPage>
      <h1 className='font-heading text-2xl font-bold'>
        {base.startsWith('/event/') ? 'Event polls' : 'Group polls'}
      </h1>
      <p>
        Independent ongoing polls. They do not choose Event dates or change
        Event RSVP or joining requirements.
      </p>
      {policy.canConfigure && (
        <section
          className='rounded-card border border-border p-4 space-y-3'
          aria-label='Poll availability policy'
        >
          <h2 className='font-heading'>Owner settings</h2>
          <Button
            disabled={policyBusy}
            onClick={() => savePolicy(!policy.enabled, policy.creation)}
          >
            {policy.enabled ? 'Disable polls' : 'Enable polls'}
          </Button>
          <Label htmlFor='poll-creation-policy'>Who can create polls?</Label>
          <select
            id='poll-creation-policy'
            value={policy.creation}
            disabled={policyBusy}
            onChange={e =>
              savePolicy(
                policy.enabled,
                e.target.value === 'MEMBERS' ? 'MEMBERS' : 'MANAGERS'
              )
            }
          >
            <option value='MANAGERS'>Owners and moderators</option>
            <option value='MEMBERS'>Any eligible member</option>
          </select>
        </section>
      )}
      {!canAccess ? (
        <p>
          Complete required onboarding before using ordinary polls. Your own
          saved history remains available by its original poll link.
        </p>
      ) : (
        <>
          {!policy.enabled && (
            <p>
              Polls are disabled. Configuration and saved votes are preserved.
              Current eligible managers can manage preserved polls.
            </p>
          )}
          {policy.enabled &&
            policy.canCreate !== false &&
            (policy.creation === 'MEMBERS' || canManage) && (
              <Link
                className='text-primary underline'
                href={`${base}/polls/new`}
              >
                Create poll
              </Link>
            )}
          {(policy.enabled || canManage) && polls === undefined ? (
            <p role='status'>Loading polls…</p>
          ) : polls?.page.length === 0 ? (
            <p>No polls on this page. Eligible creators can create a poll.</p>
          ) : null}
          {polls?.page.map(poll =>
            policy.enabled ? (
              <GroupPollInteraction
                key={poll._id}
                groupId={groupId}
                toolId={poll._id}
                embedded
              />
            ) : (
              <Link
                key={poll._id}
                className='block rounded-card border border-border p-4 font-semibold text-primary'
                href={`${base}/polls/${poll._id}/settings`}
              >
                Manage {poll.title}
              </Link>
            )
          )}
          {polls && !polls.isDone && (
            <Button onClick={() => setCursor(polls.continueCursor)}>
              Next polls
            </Button>
          )}
        </>
      )}
      {error && (
        <p
          role='alert'
          className='rounded-input border-l-4 border-border-error bg-bg-error-subtle p-3 text-sm text-error'
        >
          {error}
        </p>
      )}
    </ContentPage>
  );
}
export function GroupPollEditor({
  groupId,
  toolId,
}: {
  groupId: ContentOwnerId;
  toolId?: Id<'groupTools'>;
}) {
  const group = useGroup(groupId);
  const eligible =
    group &&
    group.joiningQuestionnaire?.canAccessMemberContent !== false &&
    (group.viewerRole === 'OWNER' || group.viewerRole === 'MODERATOR');
  const poll = usePollManagement(toolId && eligible ? { toolId } : 'skip');
  if (!toolId) return <NewPollEditor groupId={groupId} />;
  if (group === undefined) return <p role='status'>Loading content access…</p>;
  if (!eligible)
    return (
      <p role='alert'>
        Current eligible managers can manage this poll after completing required
        onboarding.
      </p>
    );
  if (toolId && !poll) return <p role='status'>Loading poll settings…</p>;
  if (poll && (poll.groupId ?? poll.eventId) !== groupId)
    return <p role='alert'>Poll unavailable in this context.</p>;
  if (poll && !poll.canManage)
    return (
      <p role='alert'>Only current eligible managers can manage this poll.</p>
    );
  return (
    <PollEditor key={poll?.version ?? 'new'} groupId={groupId} initial={poll} />
  );
}
function NewPollEditor({ groupId }: { groupId: ContentOwnerId }) {
  const group = useGroup(groupId);
  const policy = usePollPolicy({ groupId });
  if (group === undefined || policy === undefined)
    return <p role='status'>Loading poll creation policy…</p>;
  if (!group) return <p role='alert'>Content unavailable.</p>;
  if (group.joiningQuestionnaire?.canAccessMemberContent === false)
    return (
      <p role='alert'>
        Complete required onboarding before creating ordinary polls.
      </p>
    );
  if (
    policy.canCreate === false ||
    !policy.enabled ||
    (policy.creation === 'MANAGERS' && group.viewerRole === 'MEMBER')
  )
    return (
      <p role='alert'>
        Poll creation is unavailable under the current creation policy.
      </p>
    );
  return <PollEditor groupId={groupId} initial={undefined} />;
}
function PollEditor({
  groupId,
  initial,
}: {
  groupId: ContentOwnerId;
  initial: ReturnType<typeof usePollManagement>;
}) {
  const base = useContentBase(groupId);
  const create = useCreatePoll();
  const configure = useConfigurePoll();
  const deletePoll = useDeletePoll();
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? 'New poll');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [options, setOptions] = useState(
    initial?.options ?? [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
    ]
  );
  const [mode, setMode] = useState<'SINGLE' | 'MULTIPLE'>(
    initial?.mode ?? 'SINGLE'
  );
  const [visibility, setVisibility] = useState<'MANAGERS' | 'MEMBERS'>(
    initial?.resultsVisibility ?? 'MANAGERS'
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <main className='mx-auto w-full max-w-md space-y-3 px-4 py-6'>
      <h1 className='font-heading text-lg font-semibold'>
        {initial ? 'Manage poll' : 'Create poll'}
      </h1>
      <form
        className={pollCardClass}
        onSubmit={async event => {
          event.preventDefault();
          setBusy(true);
          setError('');
          try {
            if (initial) {
              await configure({
                toolId: initial._id,
                version: initial.version,
                title,
                description,
                options,
                mode,
              });
              router.push(`${base}/polls`);
            } else {
              const id = await create({
                groupId,
                title,
                description,
                options,
                mode,
                resultsVisibility: visibility,
              });
              router.push(`${base}/polls/${id}`);
            }
          } catch (e) {
            setError(
              `${failure(e)} Creation is not automatically retried; inspect the poll list before repeating an uncertain creation.`
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <Label className='sr-only' htmlFor='ordinary-poll-title'>
          Poll title
        </Label>
        <Textarea
          rows={1}
          className='min-h-6 resize-none border-transparent bg-transparent px-0 font-heading text-base font-semibold leading-snug field-sizing-content'
          id='ordinary-poll-title'
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={100}
          required
          disabled={busy}
        />
        <Label className='sr-only' htmlFor='ordinary-poll-description'>
          Description
        </Label>
        <Textarea
          rows={1}
          placeholder='Description (optional)'
          className='min-h-6 resize-y border-transparent bg-transparent px-0 text-sm leading-snug field-sizing-content'
          id='ordinary-poll-description'
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={2000}
          disabled={busy}
        />

        <Label className='sr-only' htmlFor='poll-mode'>
          Voting rule
        </Label>
        <select
          className='min-h-10 w-full rounded-input border border-input bg-background p-2 text-sm'
          id='poll-mode'
          value={mode}
          disabled={busy}
          onChange={e =>
            setMode(e.target.value === 'MULTIPLE' ? 'MULTIPLE' : 'SINGLE')
          }
        >
          <option value='SINGLE'>Choose one</option>
          <option value='MULTIPLE'>Choose several</option>
        </select>
        <fieldset disabled={busy} className='space-y-2'>
          <legend className='sr-only'>Poll options</legend>
          {options.map((option, index) => (
            <div key={index} className='flex min-w-0 items-start gap-1'>
              <div className={`${pollChoiceClass} flex-1`}>
                <Label className='sr-only' htmlFor={`option-label-${index}`}>
                  Option {index + 1} label
                </Label>
                <Textarea
                  id={`option-label-${index}`}
                  rows={1}
                  className='min-h-6 min-w-0 flex-1 resize-y border-transparent bg-transparent p-0 text-sm leading-snug field-sizing-content'
                  value={option.label}
                  onChange={e =>
                    setOptions(
                      options.map((o, i) =>
                        i === index ? { ...o, label: e.target.value } : o
                      )
                    )
                  }
                />
                <span
                  aria-hidden='true'
                  className='size-4 shrink-0 rounded-full border border-border'
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type='button'
                    size='icon'
                    variant='ghost'
                    disabled={busy}
                    aria-label={`Option ${index + 1} actions`}
                  >
                    <MoreHorizontal className='size-4' aria-hidden='true' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  {index > 0 && (
                    <DropdownMenuItem
                      onSelect={() =>
                        setOptions(
                          options.toSpliced(
                            index - 1,
                            2,
                            option,
                            options[index - 1]
                          )
                        )
                      }
                    >
                      Move option {index + 1} up
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onSelect={() =>
                      setOptions(options.filter((_, i) => i !== index))
                    }
                  >
                    Remove option {index + 1}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
          <Button
            type='button'
            variant='ghost'
            className='h-auto min-h-10 text-sm'
            onClick={() =>
              setOptions([...options, { id: crypto.randomUUID(), label: '' }])
            }
          >
            Add poll option
          </Button>
        </fieldset>
        <ContentSettings>
          {!initial && (
            <>
              <Label htmlFor='ordinary-poll-visibility'>
                Vote visibility (fixed for this poll)
              </Label>
              <select
                id='ordinary-poll-visibility'
                value={visibility}
                onChange={e =>
                  setVisibility(
                    e.target.value === 'MEMBERS' ? 'MEMBERS' : 'MANAGERS'
                  )
                }
                disabled={busy}
              >
                <option value='MANAGERS'>
                  Personal: you and current managers
                </option>
                <option value='MEMBERS'>Shared: all eligible members</option>
              </select>
            </>
          )}{' '}
          {options.map((option, index) => (
            <div key={index} className='space-y-1'>
              <Label htmlFor={`option-id-${index}`}>
                Option {index + 1} stable ID
              </Label>
              <Input
                id={`option-id-${index}`}
                value={option.id}
                disabled={busy}
                onChange={e =>
                  setOptions(
                    options.map((o, i) =>
                      i === index ? { ...o, id: e.target.value } : o
                    )
                  )
                }
              />
            </div>
          ))}
        </ContentSettings>
        <Button disabled={busy}>
          {initial ? 'Save poll settings' : 'Create poll'}
        </Button>
        <Button
          variant='ghost'
          type='button'
          disabled={busy}
          onClick={() => router.push(`${base}/polls`)}
        >
          Cancel
        </Button>
        {error && (
          <p
            role='alert'
            className='rounded-input border-l-4 border-border-error bg-bg-error-subtle p-3 text-sm text-error'
          >
            {error}
          </p>
        )}
      </form>
      {initial && (
        <GroupConfirmedAction
          label='Delete poll'
          confirmation='Confirm deleting poll and all votes'
          explanation='This permanently removes the preserved poll and all vote history.'
          onConfirm={async () => {
            await deletePoll({ toolId: initial._id });
            router.push(`${base}/polls`);
          }}
        />
      )}
    </main>
  );
}
export function GroupPollInteraction({
  groupId,
  toolId,
  embedded = false,
}: {
  groupId: ContentOwnerId;
  toolId: Id<'groupTools'>;
  embedded?: boolean;
}) {
  const poll = usePoll({ toolId });
  const submit = useSubmitPollVote();
  const sequence = useRef(0);
  const lock = useRef<{
    toolId: string;
    revision: number;
    version: number;
    sequence: number;
    running: boolean;
  } | null>(null);
  const [request, setRequest] = useState<{
    toolId: string;
    version: number;
    revision: number;
    state: 'saving' | 'saved' | 'error';
    message: string;
  } | null>(null);
  const [reset, setReset] = useState(0);
  const [results, setResults] = useState({ toolId, show: false });
  if (!poll) return <p role='status'>Loading poll…</p>;
  if ((poll.groupId ?? poll.eventId) !== groupId)
    return <p role='alert'>Poll unavailable in this context.</p>;
  const currentRequest = request?.toolId === toolId ? request : null;
  // A fulfilled mutation is not permission to submit its stale revision again.
  const busy =
    currentRequest?.state === 'saving' ||
    (currentRequest?.state === 'saved' &&
      currentRequest.revision === poll.voteRevision &&
      currentRequest.version === poll.version);
  async function vote(selections: string[]) {
    if (!poll) return;
    if (
      lock.current?.toolId === toolId &&
      (lock.current.running ||
        (lock.current.revision === poll.voteRevision &&
          lock.current.version === poll.version))
    )
      return;
    const id = ++sequence.current;
    lock.current = {
      toolId,
      revision: poll.voteRevision,
      version: poll.version,
      sequence: id,
      running: true,
    };
    setRequest({
      toolId,
      version: poll.version,
      revision: poll.voteRevision,
      state: 'saving',
      message: '',
    });
    try {
      await submit({
        toolId,
        version: poll.version,
        expectedRevision: poll.voteRevision,
        selections,
      });
      if (lock.current?.sequence !== id) return;
      lock.current.running = false;
      setRequest({
        toolId,
        version: poll.version,
        revision: poll.voteRevision,
        state: 'saved',
        message: 'Vote saved.',
      });
    } catch (error) {
      if (lock.current?.sequence !== id) return;
      lock.current = null;
      setReset(value => value + 1);
      setRequest({
        toolId,
        version: poll.version,
        revision: poll.voteRevision,
        state: 'error',
        message: failure(error),
      });
    }
  }
  return (
    <PollInteraction
      key={`${poll._id}:${poll.version}:${poll.voteRevision}:${reset}`}
      poll={poll}
      groupId={groupId}
      embedded={embedded}
      busy={Boolean(busy)}
      onVote={vote}
      showResults={results.toolId === toolId && results.show}
      onResults={() =>
        setResults({
          toolId,
          show: !(results.toolId === toolId && results.show),
        })
      }
      message={
        currentRequest?.state === 'error'
          ? currentRequest.message
          : !busy && currentRequest?.state === 'saved'
            ? currentRequest.message
            : ''
      }
      error={currentRequest?.state === 'error'}
    />
  );
}
function PollInteraction({
  poll,
  groupId,
  embedded,
  busy,
  onVote,
  showResults,
  onResults,
  message,
  error,
}: {
  poll: NonNullable<ReturnType<typeof usePoll>>;
  groupId: ContentOwnerId;
  embedded?: boolean;
  busy: boolean;
  onVote: (selections: string[]) => Promise<void>;
  showResults: boolean;
  onResults: () => void;
  message: string;
  error: boolean;
}) {
  const base = useContentBase(groupId);
  const remove = useRemovePollVote();
  const [selections, setSelections] = useState(poll.selections);
  const [cursor, setCursor] = useState<string | null>(null);
  const results = usePollResults(
    showResults && poll.canReview
      ? { toolId: poll._id, paginationOpts: { numItems: 20, cursor } }
      : 'skip'
  );
  const current =
    results?.page.filter(row => row.isCurrent && !row.removed) ?? [];
  const Tag = embedded ? 'article' : 'main';
  const Heading = embedded ? 'h2' : 'h1';
  return (
    <Tag className={pollCardClass} aria-busy={busy || undefined}>
      <Heading className='break-words font-heading text-base font-semibold leading-snug'>
        {poll.title}
      </Heading>
      {poll.description && (
        <p className='break-words text-sm leading-snug text-muted-foreground'>
          {poll.description}
        </p>
      )}
      <fieldset disabled={busy} className='min-w-0 space-y-2'>
        <legend className='mb-2 text-xs text-muted-foreground'>
          {poll.mode === 'SINGLE' ? 'Choose one' : 'Choose several'}
        </legend>
        {poll.options.map(option => {
          const count = current.filter(row =>
            row.selections.includes(option.id)
          ).length;
          return (
            <Label key={option.id} className={pollChoiceClass}>
              <span className='min-w-0 flex-1 break-words'>
                <span>{option.label}</span>
                {showResults && poll.canReview && results && (
                  <span className='mt-1 block space-y-1 text-xs text-muted-foreground'>
                    <span>
                      {current.length
                        ? Math.round((count / current.length) * 100)
                        : 0}
                      % · {count} {count === 1 ? 'vote' : 'votes'}
                    </span>
                    <span
                      role='progressbar'
                      aria-label={`${option.label}: votes on this page`}
                      aria-valuemin={0}
                      aria-valuemax={Math.max(1, current.length)}
                      aria-valuenow={count}
                      aria-valuetext={`${count} of ${current.length} votes on this page`}
                      className='block h-1 overflow-hidden rounded-badge bg-border'
                    >
                      <span
                        className='block h-full rounded-badge bg-primary'
                        style={{
                          width: `${current.length ? (count / current.length) * 100 : 0}%`,
                        }}
                      />
                    </span>
                  </span>
                )}
              </span>
              <input
                className='size-4 shrink-0 accent-primary'
                type={poll.mode === 'SINGLE' ? 'radio' : 'checkbox'}
                name={`poll-vote-${poll._id}`}
                checked={selections.includes(option.id)}
                onChange={() => {
                  const next =
                    poll.mode === 'SINGLE'
                      ? [option.id]
                      : selections.includes(option.id)
                        ? selections.filter(id => id !== option.id)
                        : [...selections, option.id];
                  setSelections(next);
                  void onVote(next);
                }}
              />
            </Label>
          );
        })}
      </fieldset>
      <div className='flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground'>
        {poll.canReview && (
          <Button
            type='button'
            variant='ghost'
            className='h-auto min-h-10 max-w-full whitespace-normal px-0 text-xs text-primary'
            aria-expanded={showResults}
            onClick={onResults}
          >
            {showResults ? 'Hide poll results' : 'View poll results'}
          </Button>
        )}
        {showResults && poll.canReview && <span>Votes on this page</span>}
        {busy && <span role='status'>Saving…</span>}
        <details className='relative ml-auto text-xs'>
          <summary
            aria-label='Poll actions'
            className='flex min-h-10 min-w-10 cursor-pointer list-none items-center justify-center rounded-input focus-visible:outline-2 focus-visible:outline-ring'
          >
            <MoreHorizontal aria-hidden='true' className='size-4' />
          </summary>
          <div className='mt-1 space-y-2 rounded-input border border-border bg-bg-sunken p-3'>
            <p>
              {poll.resultsVisibility === 'MEMBERS'
                ? 'Votes are shared with eligible members.'
                : 'Votes are visible to you and current managers.'}
            </p>
            {poll.savedVersion !== null && (
              <GroupConfirmedAction
                label='Remove my vote'
                confirmation='Confirm removing my vote and its history'
                explanation='Your latest vote and private revision history will be removed.'
                onConfirm={() =>
                  remove({
                    toolId: poll._id,
                    expectedRevision: poll.voteRevision,
                  })
                }
              />
            )}
            {poll.canManage && (
              <Link
                className='block text-primary underline'
                href={`${base}/polls/${poll._id}/settings`}
              >
                Edit poll
              </Link>
            )}
            {poll.canReview && (
              <Link
                className='block text-primary underline'
                href={`${base}/polls/${poll._id}/results`}
              >
                Review votes
              </Link>
            )}
          </div>
        </details>
      </div>
      {showResults && poll.canReview && !results && (
        <p role='status' className='text-xs text-muted-foreground'>
          Loading results…
        </p>
      )}
      {showResults && results && !results.isDone && (
        <Button
          variant='ghost'
          onClick={() => setCursor(results.continueCursor)}
        >
          Next votes
        </Button>
      )}
      {showResults && cursor && (
        <Button variant='ghost' onClick={() => setCursor(null)}>
          First results page
        </Button>
      )}
      {message && (
        <p
          role={error ? 'alert' : 'status'}
          className={error ? 'text-xs text-error' : 'sr-only'}
        >
          {message}
          {error && ' Select an option to try again.'}
        </p>
      )}
    </Tag>
  );
}
function SavedVotes({
  options,
  selections,
}: {
  options: NonNullable<ReturnType<typeof usePoll>>['options'];
  selections: string[];
}) {
  return (
    <ul>
      {options
        .filter(option => selections.includes(option.id))
        .map(option => (
          <li key={option.id}>{option.label}</li>
        ))}
    </ul>
  );
}
export function GroupPollHistory({ toolId }: { toolId: Id<'groupTools'> }) {
  const [cursor, setCursor] = useState<string | null>(null);
  const history = usePollHistory({
    toolId,
    paginationOpts: { numItems: 20, cursor },
  });
  const remove = useRemovePollVote();
  return (
    <section className='p-6 space-y-4'>
      <h1 className='font-heading'>My saved poll history</h1>
      <p>
        Only your retained votes and original definitions are shown. Current
        private options are not exposed by this recovery view.
      </p>
      {history === undefined ? (
        <p role='status'>Loading saved history…</p>
      ) : history.page.length === 0 ? (
        <p>No saved votes on this page.</p>
      ) : null}
      {history?.page.map(row => (
        <div className='rounded-card border border-border p-4' key={row._id}>
          <p>
            Vote revision {row.revision}, poll version {row.version}
          </p>
          <SavedVotes options={row.options} selections={row.selections} />
        </div>
      ))}
      {history && !history.isDone && (
        <Button onClick={() => setCursor(history.continueCursor)}>
          Next history
        </Button>
      )}
      {cursor && (
        <Button onClick={() => setCursor(null)}>First history page</Button>
      )}
      {history && history.voteRevision > 0 && (
        <GroupConfirmedAction
          key={history.voteRevision}
          label='Remove my vote and history'
          confirmation='Confirm removing my vote and history'
          explanation='Your latest vote and all private revisions will be removed.'
          onConfirm={() =>
            remove({ toolId, expectedRevision: history.voteRevision })
          }
        />
      )}
    </section>
  );
}
function PollResultsRecords({
  toolId,
  canManage,
  options = [],
}: {
  toolId: Id<'groupTools'>;
  canManage: boolean;
  options?: NonNullable<ReturnType<typeof usePoll>>['options'];
}) {
  const [cursor, setCursor] = useState<string | null>(null);
  const results = usePollResults({
    toolId,
    paginationOpts: { numItems: 20, cursor },
  });
  const remove = useRemovePollResult();
  const current =
    results?.page.filter(row => row.isCurrent && !row.removed) ?? [];
  return (
    <section className='space-y-3'>
      <h2 className='font-heading'>Latest votes</h2>
      <p>
        Latest votes on this page; this is not an overall total. Historical
        votes do not count under the current rule.
      </p>
      {results === undefined ? (
        <p role='status'>Loading votes…</p>
      ) : results.page.length === 0 ? (
        <p>No votes on this page.</p>
      ) : null}
      {results && options.length > 0 && (
        <div
          className='space-y-3 rounded-input bg-bg-sunken p-4'
          aria-label='Current votes on this page'
        >
          {options.map(option => {
            const count = current.filter(row =>
              row.selections.includes(option.id)
            ).length;
            return (
              <div key={option.id} className='space-y-2'>
                <div className='flex items-start justify-between gap-4 text-sm'>
                  <span className='min-w-0 break-words font-medium'>
                    {option.label}
                  </span>
                  <span className='shrink-0 tabular-nums'>
                    {count} / {current.length}
                  </span>
                </div>
                <progress
                  aria-label={`${option.label}: votes on this page`}
                  className='h-2 w-full accent-primary'
                  max={Math.max(1, current.length)}
                  value={count}
                />
              </div>
            );
          })}
        </div>
      )}
      {results?.page.map(row => (
        <div key={row._id} className='rounded-card border border-border p-4'>
          <p>
            {row.personId ? 'Member contribution' : 'Anonymous contribution'} ·
            poll version {row.version}
          </p>
          <p>
            {row.removed
              ? 'Removed vote'
              : row.isCurrent
                ? 'Current vote'
                : 'Historical vote: no longer counts under the current rule'}
          </p>
          <SavedVotes options={row.options} selections={row.selections} />
          {canManage && !row.removed && (
            <GroupConfirmedAction
              label='Remove vote'
              confirmation='Confirm removing this vote'
              explanation='Moderation removes this vote and associated private history.'
              onConfirm={() =>
                remove({ voteId: row._id, expectedRevision: row.revision })
              }
            />
          )}
        </div>
      ))}
      {cursor && (
        <Button onClick={() => setCursor(null)}>First results page</Button>
      )}
      {results && !results.isDone && (
        <Button onClick={() => setCursor(results.continueCursor)}>
          Next votes
        </Button>
      )}
    </section>
  );
}

export function GroupPollResults({
  groupId,
  toolId,
}: {
  groupId: ContentOwnerId;
  toolId: Id<'groupTools'>;
}) {
  const poll = usePoll({ toolId });
  if (poll === undefined)
    return <p role='status'>Loading result permissions…</p>;
  if ((poll.groupId ?? poll.eventId) !== groupId || !poll.canReview)
    return (
      <p role='alert'>Poll results are unavailable under current access.</p>
    );
  return (
    <ContentPage>
      <ContentKind kind='Poll' />
      <h1>{poll.title}</h1>
      <PollResultsRecords
        toolId={toolId}
        canManage={poll.canManage}
        options={poll.options}
      />
    </ContentPage>
  );
}

/** Ordinary participation stays in the feed; original detail/history URLs remain valid. */
export function GroupPollFeed({ groupId }: { groupId: ContentOwnerId }) {
  const group = useGroup(groupId);
  const policy = usePollPolicy({ groupId });
  const [cursor, setCursor] = useState<string | null>(null);
  const eligible =
    group && group.joiningQuestionnaire?.canAccessMemberContent !== false;
  const polls = usePolls(
    eligible && policy?.enabled
      ? { groupId, paginationOpts: { numItems: 10, cursor } }
      : 'skip'
  );
  if (!eligible || !policy?.enabled) return null;
  return (
    <section aria-label='Polls' className='min-w-0 space-y-4'>
      {polls === undefined && <p role='status'>Loading polls…</p>}
      {polls?.page.map(poll => (
        <GroupPollInteraction
          key={poll._id}
          groupId={groupId}
          toolId={poll._id}
          embedded
        />
      ))}
      {polls && !polls.isDone && (
        <Button
          variant='outline'
          onClick={() => setCursor(polls.continueCursor)}
        >
          More polls
        </Button>
      )}
    </section>
  );
}
