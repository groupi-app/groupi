'use client';
import { useState } from 'react';
import { GROUP_POLL_TEMPLATES } from '@groupi/shared/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';

import { useGroup } from '@/hooks/convex/use-groups';
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
import { Label } from '@/components/ui/label';

import { GroupConfirmedAction } from './group-confirmed-action';
const failure = (error: unknown) =>
  error instanceof Error
    ? error.message
    : 'Operation failed. Inspect current state before repeating.';
export function GroupPolls({ groupId }: { groupId: Id<'groups'> }) {
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
    <main className='p-6 space-y-4'>
      <h1 className='text-2xl font-bold'>Group polls</h1>
      <p>
        Independent ongoing polls. They do not choose Event dates or change
        Event RSVP or joining requirements.
      </p>
      {policy.canConfigure && (
        <section
          className='rounded-card border border-border p-4 space-y-3'
          aria-label='Poll availability policy'
        >
          <h2>Owner settings</h2>
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
          {policy.enabled && (policy.creation === 'MEMBERS' || canManage) && (
            <Link
              className='text-primary underline'
              href={`/groups/${groupId}/polls/new`}
            >
              Create poll
            </Link>
          )}
          {(policy.enabled || canManage) && polls === undefined ? (
            <p role='status'>Loading polls…</p>
          ) : polls?.page.length === 0 ? (
            <p>No polls on this page. Eligible creators can create a poll.</p>
          ) : null}
          {polls?.page.map(poll => (
            <div
              key={poll._id}
              className='rounded-card border border-border p-4'
            >
              <Link
                className='text-primary underline'
                href={
                  policy.enabled
                    ? `/groups/${groupId}/polls/${poll._id}`
                    : `/groups/${groupId}/polls/${poll._id}/settings`
                }
              >
                {policy.enabled ? poll.title : `Manage ${poll.title}`}
              </Link>
              <p>{poll.description}</p>
              <p>
                {poll.resultsVisibility === 'MEMBERS'
                  ? 'Shared votes visible to eligible members'
                  : 'Personal votes visible to you and current managers'}
              </p>
            </div>
          ))}
          {polls && !polls.isDone && (
            <Button onClick={() => setCursor(polls.continueCursor)}>
              Next polls
            </Button>
          )}
        </>
      )}
      {error && <p role='alert'>{error}</p>}
    </main>
  );
}
export function GroupPollEditor({
  groupId,
  toolId,
}: {
  groupId: Id<'groups'>;
  toolId?: Id<'groupTools'>;
}) {
  const group = useGroup(groupId);
  const eligible =
    group &&
    group.joiningQuestionnaire?.canAccessMemberContent !== false &&
    (group.viewerRole === 'OWNER' || group.viewerRole === 'MODERATOR');
  const poll = usePollManagement(toolId && eligible ? { toolId } : 'skip');
  if (!toolId) return <NewPollEditor groupId={groupId} />;
  if (group === undefined) return <p role='status'>Loading Group…</p>;
  if (!eligible)
    return (
      <p role='alert'>
        Current eligible managers can manage this poll after completing required
        onboarding.
      </p>
    );
  if (toolId && !poll) return <p role='status'>Loading poll settings…</p>;
  if (poll && poll.groupId !== groupId)
    return <p role='alert'>Poll unavailable in this Group.</p>;
  if (poll && !poll.canManage)
    return (
      <p role='alert'>Only current eligible managers can manage this poll.</p>
    );
  return (
    <PollEditor key={poll?.version ?? 'new'} groupId={groupId} initial={poll} />
  );
}
function NewPollEditor({ groupId }: { groupId: Id<'groups'> }) {
  const group = useGroup(groupId);
  const policy = usePollPolicy({ groupId });
  if (group === undefined || policy === undefined)
    return <p role='status'>Loading poll creation policy…</p>;
  if (!group) return <p role='alert'>Group unavailable.</p>;
  if (group.joiningQuestionnaire?.canAccessMemberContent === false)
    return (
      <p role='alert'>
        Complete required onboarding before creating ordinary polls.
      </p>
    );
  if (
    !policy.enabled ||
    (policy.creation === 'MANAGERS' && group.viewerRole === 'MEMBER')
  )
    return (
      <p role='alert'>
        Poll creation is unavailable under the current owner policy.
      </p>
    );
  return <PollEditor groupId={groupId} initial={undefined} />;
}
function PollEditor({
  groupId,
  initial,
}: {
  groupId: Id<'groups'>;
  initial: ReturnType<typeof usePollManagement>;
}) {
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
    <main className='p-6 space-y-4'>
      <h1>{initial ? 'Manage poll' : 'Create poll'}</h1>
      {!initial &&
        GROUP_POLL_TEMPLATES.map(template => (
          <Button
            key={template.id}
            variant='outline'
            disabled={busy}
            onClick={() => {
              setTitle(template.title);
              setDescription(template.description);
              setOptions(template.options.map(o => ({ ...o })));
              setMode(template.mode);
            }}
          >
            Use {template.title} template
          </Button>
        ))}
      <form
        className='space-y-4'
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
              router.push(`/groups/${groupId}/polls`);
            } else {
              const id = await create({
                groupId,
                title,
                description,
                options,
                mode,
                resultsVisibility: visibility,
              });
              router.push(`/groups/${groupId}/polls/${id}`);
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
        <Label htmlFor='ordinary-poll-title'>Poll title</Label>
        <Input
          id='ordinary-poll-title'
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={100}
          required
          disabled={busy}
        />
        <Label htmlFor='ordinary-poll-description'>Description</Label>
        <Input
          id='ordinary-poll-description'
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={2000}
          disabled={busy}
        />
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
        )}
        <p>
          Configuration changes preserve saved votes and their original option
          definitions. Current-version choices require review before saving.
          This is not the joining questionnaire.
        </p>
        <Label htmlFor='poll-mode'>Voting rule</Label>
        <select
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
        <fieldset disabled={busy} className='space-y-3'>
          <legend>Poll options</legend>
          {options.map((option, index) => (
            <div key={index} className='space-y-2'>
              <Label htmlFor={`option-id-${index}`}>
                Option {index + 1} stable ID
              </Label>
              <Input
                id={`option-id-${index}`}
                value={option.id}
                onChange={e =>
                  setOptions(
                    options.map((o, i) =>
                      i === index ? { ...o, id: e.target.value } : o
                    )
                  )
                }
              />
              <Label htmlFor={`option-label-${index}`}>
                Option {index + 1} label
              </Label>
              <Input
                id={`option-label-${index}`}
                value={option.label}
                onChange={e =>
                  setOptions(
                    options.map((o, i) =>
                      i === index ? { ...o, label: e.target.value } : o
                    )
                  )
                }
              />
              <Button
                type='button'
                variant='outline'
                onClick={() =>
                  setOptions(options.filter((_, i) => i !== index))
                }
              >
                Remove option {index + 1}
              </Button>
              {index > 0 && (
                <Button
                  type='button'
                  variant='outline'
                  onClick={() =>
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
                </Button>
              )}
            </div>
          ))}
          <Button
            type='button'
            onClick={() =>
              setOptions([
                ...options,
                { id: `option-${Date.now()}`, label: '' },
              ])
            }
          >
            Add poll option
          </Button>
        </fieldset>
        <p>
          Stable IDs identify choices. Label and order changes retain valid
          votes. Changing the rule or option IDs makes earlier votes historical;
          members must vote again. Results visibility stays fixed.
        </p>
        <Button disabled={busy}>
          {initial ? 'Save poll settings' : 'Create poll'}
        </Button>
        {error && <p role='alert'>{error}</p>}
      </form>
      {initial && (
        <GroupConfirmedAction
          label='Delete poll'
          confirmation='Confirm deleting poll and all votes'
          explanation='This permanently removes the preserved poll and all vote history.'
          onConfirm={async () => {
            await deletePoll({ toolId: initial._id });
            router.push(`/groups/${groupId}/polls`);
          }}
        />
      )}
    </main>
  );
}
export function GroupPollInteraction({
  groupId,
  toolId,
}: {
  groupId: Id<'groups'>;
  toolId: Id<'groupTools'>;
}) {
  const poll = usePoll({ toolId });
  if (!poll) return <p role='status'>Loading poll…</p>;
  if (poll.groupId !== groupId)
    return <p role='alert'>Poll unavailable in this Group.</p>;
  return (
    <PollInteraction
      key={`${poll.version}:${poll.voteRevision}`}
      poll={poll}
      groupId={groupId}
    />
  );
}
function PollInteraction({
  poll,
  groupId,
}: {
  poll: NonNullable<ReturnType<typeof usePoll>>;
  groupId: Id<'groups'>;
}) {
  const submit = useSubmitPollVote();
  const remove = useRemovePollVote();
  const deletePoll = useDeletePoll();
  const router = useRouter();
  const [selections, setSelections] = useState(poll.selections);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  return (
    <main className='p-6 space-y-4'>
      <h1>{poll.title}</h1>
      <p>{poll.description}</p>
      <p>
        Group polls do not choose Event dates or change Event RSVP. One latest
        vote is saved; repeat saves are safe and concurrent edits require
        current revision review.
      </p>
      <p>
        {poll.resultsVisibility === 'MEMBERS'
          ? 'Shared contribution: eligible Group members can see your latest votes. On account deletion, that shared contribution survives anonymously; your private revision history is purged.'
          : 'Personal votes: only you and current eligible Group managers can see them. Account deletion purges your votes and history.'}{' '}
        Managers may moderate ordinary votes. Removing your vote also removes
        its history.
      </p>
      <form
        className='space-y-4'
        onSubmit={async e => {
          e.preventDefault();
          setBusy(true);
          setMessage('');
          try {
            await submit({
              toolId: poll._id,
              version: poll.version,
              expectedRevision: poll.voteRevision,
              selections,
            });
            setMessage('Vote saved.');
          } catch (error) {
            setMessage(failure(error));
          } finally {
            setBusy(false);
          }
        }}
      >
        <fieldset disabled={busy}>
          <legend>
            {poll.mode === 'SINGLE'
              ? 'Choose one option'
              : 'Choose one or more options'}
          </legend>
          {poll.options.map(option => (
            <Label key={option.id} className='block'>
              <input
                type={poll.mode === 'SINGLE' ? 'radio' : 'checkbox'}
                name='poll-vote'
                checked={selections.includes(option.id)}
                onChange={() =>
                  setSelections(
                    poll.mode === 'SINGLE'
                      ? [option.id]
                      : selections.includes(option.id)
                        ? selections.filter(id => id !== option.id)
                        : [...selections, option.id]
                  )
                }
              />
              {option.label}
            </Label>
          ))}
        </fieldset>
        <Button disabled={busy}>Save vote</Button>
      </form>
      {poll.savedVersion !== null && (
        <p>
          Original saved options remain in your private history. Review current
          choices before resubmitting after voting rules or option IDs change.
        </p>
      )}
      {poll.savedVersion !== null && (
        <GroupConfirmedAction
          label='Remove my vote'
          confirmation='Confirm removing my vote and its history'
          explanation='Your latest vote and private revision history will be removed.'
          onConfirm={() =>
            remove({ toolId: poll._id, expectedRevision: poll.voteRevision })
          }
        />
      )}
      <Link
        className='text-primary underline'
        href={`/groups/${groupId}/polls/${poll._id}/history`}
      >
        My saved vote history
      </Link>
      {poll.canManage && (
        <>
          <Link
            className='text-primary underline'
            href={`/groups/${groupId}/polls/${poll._id}/settings`}
          >
            Manage poll settings
          </Link>
          <GroupConfirmedAction
            label='Delete poll'
            confirmation='Confirm deleting poll and all votes'
            explanation='This permanently removes the poll and all vote history.'
            onConfirm={async () => {
              await deletePoll({ toolId: poll._id });
              router.push(`/groups/${groupId}/polls`);
            }}
          />
        </>
      )}
      {message && <p role='status'>{message}</p>}
      {poll.canReview && (
        <Link
          className='text-primary underline'
          href={`/groups/${groupId}/polls/${poll._id}/results`}
        >
          View poll results
        </Link>
      )}
    </main>
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
      <h1>My saved poll history</h1>
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
}: {
  toolId: Id<'groupTools'>;
  canManage: boolean;
}) {
  const [cursor, setCursor] = useState<string | null>(null);
  const results = usePollResults({
    toolId,
    paginationOpts: { numItems: 20, cursor },
  });
  const remove = useRemovePollResult();
  return (
    <section className='space-y-3'>
      <h2>Latest votes</h2>
      <p>
        Latest votes on this page; this is not a Group-wide total. Historical
        votes do not count under the current rule.
      </p>
      {results === undefined ? (
        <p role='status'>Loading votes…</p>
      ) : results.page.length === 0 ? (
        <p>No votes on this page.</p>
      ) : null}
      {results?.page.map(row => (
        <div key={row._id} className='rounded-card border border-border p-4'>
          <p>
            {row.personId
              ? 'Group member contribution'
              : 'Anonymous contribution'}{' '}
            · poll version {row.version}
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
  groupId: Id<'groups'>;
  toolId: Id<'groupTools'>;
}) {
  const poll = usePoll({ toolId });
  if (poll === undefined)
    return <p role='status'>Loading result permissions…</p>;
  if (poll.groupId !== groupId || !poll.canReview)
    return (
      <p role='alert'>Poll results are unavailable under current access.</p>
    );
  return <PollResultsRecords toolId={toolId} canManage={poll.canManage} />;
}
