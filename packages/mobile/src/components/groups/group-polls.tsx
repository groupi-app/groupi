import { useState, type ReactNode } from 'react';
import { View, TextInput } from 'react-native';
import { router } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { GROUP_POLL_TEMPLATES } from '@groupi/shared/utils';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { useGroup } from '@/hooks/use-groups';
import * as hooks from '@/hooks/use-group-polls';

import { GroupPageControls } from './group-page-controls';
type Poll = NonNullable<ReturnType<typeof hooks.usePoll>>;
type GroupId = Id<'groups'>;
type ToolId = Id<'groupTools'>;
export function OrdinaryPollGate({
  groupId,
  children,
  management = false,
}: {
  groupId: GroupId;
  children: ReactNode;
  management?: boolean;
}) {
  const group = useGroup(groupId);
  const policy = hooks.usePollPolicy(group ? { groupId } : 'skip');
  if (group === undefined) return <Text>Loading Group…</Text>;
  if (!group) return <Text>Current Group membership is required.</Text>;
  if (group.joiningQuestionnaire?.canAccessMemberContent === false)
    return (
      <View className='gap-3'>
        <Text>Complete required onboarding before accessing Group polls.</Text>
        <Button
          accessibilityLabel='Complete required Group onboarding'
          onPress={() => router.push(`/groups/${groupId}/questionnaire`)}
        >
          Complete onboarding
        </Button>
      </View>
    );
  if (policy === undefined) return <Text>Loading polls policy…</Text>;
  if (!policy.enabled && !(management && group.canManageMembers))
    return (
      <Text>
        Polls are disabled. Your own saved history remains available through its
        direct link.
      </Text>
    );
  return <>{children}</>;
}
export function GroupPollsHub({ groupId }: { groupId: GroupId }) {
  return (
    <View className='gap-3'>
      <Button
        accessibilityLabel='Group poll policy'
        onPress={() => router.push(`/groups/${groupId}/polls/policy`)}
      >
        Polls policy
      </Button>
      <OrdinaryPollGate groupId={groupId} management>
        <PollsList groupId={groupId} />
      </OrdinaryPollGate>
    </View>
  );
}
function PollsList({ groupId }: { groupId: GroupId }) {
  const [cursor, setCursor] = useState<string | null>(null);
  const page = hooks.usePolls({
    groupId,
    paginationOpts: { numItems: 20, cursor },
  });
  const policy = hooks.usePollPolicy({ groupId });
  const group = useGroup(groupId);
  return (
    <View className='gap-3'>
      {policy && !policy.enabled && (
        <Text>
          Polls are disabled. Eligible managers can manage preserved
          configurations.
        </Text>
      )}
      {policy?.enabled &&
      (policy.creation === 'MEMBERS' || group?.canManageMembers) ? (
        <Button
          accessibilityLabel='Create Group poll'
          onPress={() => router.push(`/groups/${groupId}/polls/create`)}
        >
          Create poll
        </Button>
      ) : null}
      {page === undefined ? (
        <Text>Loading polls…</Text>
      ) : page.page.length === 0 ? (
        <Text>No polls on this page.</Text>
      ) : (
        page.page.map(poll => (
          <Button
            key={poll._id}
            variant='outline'
            accessibilityLabel={`${policy?.enabled ? 'Open' : 'Manage'} poll ${poll.title}`}
            onPress={() =>
              router.push(
                policy?.enabled
                  ? `/groups/${groupId}/polls/${poll._id}`
                  : `/groups/${groupId}/polls/${poll._id}/manage`
              )
            }
          >
            {poll.title}
          </Button>
        ))
      )}
      <GroupPageControls
        page={page}
        cursor={cursor}
        onPage={setCursor}
        label='Polls'
      />
    </View>
  );
}
export function GroupPollPolicy({ groupId }: { groupId: GroupId }) {
  const policy = hooks.usePollPolicy({ groupId });
  const configure = hooks.useConfigurePollPolicy();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  if (!policy) return <Text>Loading polls policy…</Text>;
  if (!policy.canConfigure)
    return <Text>Only the Group owner can configure polls policy.</Text>;
  async function save(enabled: boolean, creation: 'MANAGERS' | 'MEMBERS') {
    setBusy(true);
    try {
      await configure({ groupId, enabled, creation });
      setMessage('Polls policy saved.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not save policy.'
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <View className='gap-3'>
      <Text>
        Owner policy controls ordinary polls, separately from admission and
        joining questionnaires. Disabling polls preserves saved votes.
      </Text>
      <Button
        accessibilityLabel='Enable Group polls'
        role='checkbox'
        accessibilityRole='checkbox'
        accessibilityState={{ checked: policy.enabled, disabled: busy }}
        disabled={busy}
        onPress={() => save(!policy.enabled, policy.creation)}
      >
        {policy.enabled ? 'Polls enabled' : 'Polls disabled'}
      </Button>
      {(['MANAGERS', 'MEMBERS'] as const).map(creation => (
        <Button
          key={creation}
          accessibilityLabel={`Poll creation ${creation}`}
          role='radio'
          accessibilityRole='radio'
          accessibilityState={{
            checked: policy.creation === creation,
            disabled: busy,
          }}
          disabled={busy}
          onPress={() => save(policy.enabled, creation)}
        >
          {creation === 'MANAGERS'
            ? 'Managers create polls'
            : 'All members create polls'}
        </Button>
      ))}
      {message ? <Text accessibilityRole='alert'>{message}</Text> : null}
    </View>
  );
}
export function GroupOrdinaryPollEditor({
  groupId,
  toolId,
}: {
  groupId: GroupId;
  toolId?: ToolId;
}) {
  return (
    <OrdinaryPollGate groupId={groupId} management>
      <EditorLoader groupId={groupId} toolId={toolId} />
    </OrdinaryPollGate>
  );
}
function EditorLoader({
  groupId,
  toolId,
}: {
  groupId: GroupId;
  toolId?: ToolId;
}) {
  const group = useGroup(groupId);
  const poll = hooks.usePollManagement(
    toolId && group?.canManageMembers ? { toolId } : 'skip'
  );
  const policy = hooks.usePollPolicy({ groupId });
  if (toolId && group && !group.canManageMembers)
    return <Text>Current eligible managers can manage this poll.</Text>;
  if (!toolId && policy && !policy.enabled)
    return <Text>Poll creation is unavailable while polls are disabled.</Text>;
  if (toolId && !poll) return <Text>Loading poll…</Text>;
  if (poll && poll.groupId !== groupId)
    return <Text>Poll belongs to another Group.</Text>;
  if (
    poll
      ? !poll.canManage
      : policy?.creation !== 'MEMBERS' && !group?.canManageMembers
  )
    return <Text>Poll management is unavailable under owner policy.</Text>;
  return (
    <PollEditor key={poll?.version ?? 'new'} groupId={groupId} poll={poll} />
  );
}
function PollEditor({
  groupId,
  poll,
}: {
  groupId: GroupId;
  poll?: NonNullable<ReturnType<typeof hooks.usePollManagement>>;
}) {
  const create = hooks.useCreatePoll();
  const configure = hooks.useConfigurePoll();
  const remove = hooks.useDeletePoll();
  const [title, setTitle] = useState(poll?.title ?? 'New poll');
  const [description, setDescription] = useState(poll?.description ?? '');
  const [options, setOptions] = useState<Poll['options']>(
    poll?.options ?? [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
    ]
  );
  const [mode, setMode] = useState<Poll['mode']>(poll?.mode ?? 'SINGLE');
  const [visibility, setVisibility] = useState<'MANAGERS' | 'MEMBERS'>(
    poll?.resultsVisibility ?? 'MANAGERS'
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function save() {
    setBusy(true);
    try {
      const data = { title, description, options, mode };
      if (poll) {
        await configure({ toolId: poll._id, version: poll.version, ...data });
        setMessage('Poll saved. Original answered definitions are retained.');
      } else {
        const id = await create({
          groupId,
          ...data,
          resultsVisibility: visibility,
        });
        router.replace(`/groups/${groupId}/polls/${id}`);
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not save poll.'
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <View className='gap-3'>
      {!poll
        ? GROUP_POLL_TEMPLATES.map(template => (
            <Button
              key={template.id}
              disabled={busy}
              accessibilityLabel={`Use poll template ${template.title}`}
              onPress={() => {
                setTitle(template.title);
                setDescription(template.description);
                setOptions(template.options.map(o => ({ ...o })));
                setMode(template.mode);
              }}
            >
              {template.title}
            </Button>
          ))
        : null}
      <TextInput
        className='rounded-input border border-border p-3 text-foreground'
        accessibilityLabel='Poll title'
        editable={!busy}
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        className='rounded-input border border-border p-3 text-foreground'
        accessibilityLabel='Poll description'
        editable={!busy}
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <Text>Results visibility is fixed at creation.</Text>
      {poll ? (
        <Text>
          {visibility === 'MANAGERS'
            ? 'Private to managers'
            : 'Shared with members'}
        </Text>
      ) : (
        (['MANAGERS', 'MEMBERS'] as const).map(mode => (
          <Button
            key={mode}
            disabled={busy}
            accessibilityLabel={`Poll results ${mode}`}
            role='radio'
            accessibilityRole='radio'
            accessibilityState={{
              checked: visibility === mode,
              disabled: busy,
            }}
            onPress={() => setVisibility(mode)}
          >
            {mode === 'MANAGERS'
              ? 'Private to managers'
              : 'Shared with members'}
          </Button>
        ))
      )}
      <Text>Voting rule</Text>
      {(['SINGLE', 'MULTIPLE'] as const).map(value => (
        <Button
          key={value}
          accessibilityLabel={`Voting rule ${value}`}
          role='radio'
          accessibilityRole='radio'
          accessibilityState={{ checked: mode === value, disabled: busy }}
          disabled={busy}
          onPress={() => setMode(value)}
        >
          {value === 'SINGLE' ? 'Choose one' : 'Choose several'}
        </Button>
      ))}
      {options.map((option, index) => (
        <View key={index} className='gap-2'>
          <TextInput
            className='rounded-input border border-border p-3 text-foreground'
            accessibilityLabel={`Option ${index + 1} stable ID`}
            value={option.id}
            editable={!busy}
            onChangeText={id =>
              setOptions(
                options.map((o, i) => (i === index ? { ...o, id } : o))
              )
            }
          />
          <TextInput
            className='rounded-input border border-border p-3 text-foreground'
            accessibilityLabel={`Option ${index + 1} label`}
            value={option.label}
            editable={!busy}
            onChangeText={label =>
              setOptions(
                options.map((o, i) => (i === index ? { ...o, label } : o))
              )
            }
          />
          <Button
            accessibilityLabel={`Remove option ${index + 1}`}
            disabled={busy}
            variant='outline'
            onPress={() => setOptions(options.filter((_, i) => i !== index))}
          >
            Remove option
          </Button>
          {index > 0 && (
            <Button
              accessibilityLabel={`Move option ${index + 1} up`}
              disabled={busy}
              variant='outline'
              onPress={() =>
                setOptions(
                  options.map((o, i) =>
                    i === index - 1
                      ? option
                      : i === index
                        ? options[index - 1]
                        : o
                  )
                )
              }
            >
              Move up
            </Button>
          )}
        </View>
      ))}
      <Button
        accessibilityLabel='Add poll option'
        disabled={busy}
        onPress={() =>
          setOptions([...options, { id: `option-${Date.now()}`, label: '' }])
        }
      >
        Add option
      </Button>
      <Text>
        Stable IDs identify choices. Label and order changes retain valid votes.
        Changing the rule or IDs makes older votes historical; members must vote
        again. Results visibility stays fixed.
      </Text>
      <Button
        accessibilityLabel='Save Group poll'
        disabled={busy}
        accessibilityState={{ busy, disabled: busy }}
        onPress={save}
      >
        Save poll
      </Button>
      {poll ? (
        <Button
          accessibilityLabel='Delete Group poll'
          disabled={busy}
          onPress={() =>
            showConfirmDialog({
              title: 'Delete poll?',
              message:
                'This permanently deletes this poll and all saved votes and revisions.',
              destructive: true,
              onConfirm: () => {
                setBusy(true);
                void remove({ toolId: poll._id })
                  .then(() => router.replace(`/groups/${groupId}/polls`))
                  .catch(error =>
                    setMessage(
                      error instanceof Error
                        ? error.message
                        : 'Could not delete poll.'
                    )
                  )
                  .finally(() => setBusy(false));
              },
            })
          }
        >
          Delete poll
        </Button>
      ) : null}
      {message ? <Text accessibilityRole='alert'>{message}</Text> : null}
    </View>
  );
}
export function GroupOrdinaryPoll({
  groupId,
  toolId,
}: {
  groupId: GroupId;
  toolId: ToolId;
}) {
  return (
    <View className='gap-3'>
      <Button
        accessibilityLabel='My poll vote history'
        onPress={() =>
          router.push(`/groups/${groupId}/polls/${toolId}/history`)
        }
      >
        My saved vote history
      </Button>
      <OrdinaryPollGate groupId={groupId}>
        <AnswerLoader groupId={groupId} toolId={toolId} />
      </OrdinaryPollGate>
    </View>
  );
}
function AnswerLoader({
  groupId,
  toolId,
}: {
  groupId: GroupId;
  toolId: ToolId;
}) {
  const poll = hooks.usePoll({ toolId });
  if (!poll) return <Text>Loading poll…</Text>;
  if (poll.groupId !== groupId)
    return <Text>Poll belongs to another Group.</Text>;
  return (
    <PollVotes
      key={`${poll.version}-${poll.voteRevision}`}
      groupId={groupId}
      poll={poll}
    />
  );
}
function PollVotes({ groupId, poll }: { groupId: GroupId; poll: Poll }) {
  const submit = hooks.useSubmitPollVote();
  const remove = hooks.useRemovePollVote();
  const [selections, setSelections] = useState(poll.selections);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await action();
      setMessage(success);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not save vote.'
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <View className='gap-3'>
      <Text accessibilityRole='header'>{poll.title}</Text>
      <Text>
        Group polls do not choose Event dates or change RSVP. Votes save one
        latest selection; editing uses the current revision. If choices or
        voting rules change, review the new choices before voting again.
      </Text>
      <Text>{poll.description}</Text>
      <Text>
        {poll.resultsVisibility === 'MANAGERS'
          ? 'Private votes are visible to you and current eligible Group managers. Leaving or being removed from the Group retains your saved vote with your author identity and private snapshots. Explicitly removing your vote clears its selections and private history. Account deletion purges your private votes and history.'
          : 'Shared votes are visible to current eligible Group members. Leaving or being removed from the Group retains your saved vote with your author identity and private snapshots. Explicitly removing your vote clears its selections and private history. Account deletion preserves shared latest votes anonymously and purges private history.'}
      </Text>
      <Text>
        {poll.mode === 'SINGLE'
          ? 'Choose one option'
          : 'Choose one or more options'}
      </Text>
      {poll.options.map(option => (
        <Button
          key={option.id}
          accessibilityLabel={`Vote ${option.label}`}
          role={poll.mode === 'SINGLE' ? 'radio' : 'checkbox'}
          accessibilityRole={poll.mode === 'SINGLE' ? 'radio' : 'checkbox'}
          accessibilityState={{
            checked: selections.includes(option.id),
            disabled: busy,
          }}
          disabled={busy}
          variant={selections.includes(option.id) ? 'default' : 'outline'}
          onPress={() =>
            setSelections(
              poll.mode === 'SINGLE'
                ? [option.id]
                : selections.includes(option.id)
                  ? selections.filter(id => id !== option.id)
                  : [...selections, option.id]
            )
          }
        >
          {option.label}
        </Button>
      ))}
      <Button
        accessibilityLabel='Save Group poll votes'
        disabled={busy}
        accessibilityState={{ busy, disabled: busy }}
        onPress={() =>
          run(
            () =>
              submit({
                toolId: poll._id,
                version: poll.version,
                expectedRevision: poll.voteRevision,
                selections,
              }),
            'Votes saved.'
          )
        }
      >
        Save votes
      </Button>
      {poll.savedVersion !== null ? (
        <>
          <Text>
            Saved definitions from version {poll.savedVersion}. Your original
            choices remain in private history; historical votes do not count
            under a changed rule.
          </Text>
          {poll.savedOptions.map(q => (
            <Text key={q.id}>{q.label}</Text>
          ))}
          <Button
            accessibilityLabel='Remove my poll vote'
            disabled={busy}
            onPress={() =>
              showConfirmDialog({
                title: 'Remove your vote?',
                message: 'This deletes your saved vote and its history.',
                destructive: true,
                onConfirm: () =>
                  void run(
                    () =>
                      remove({
                        toolId: poll._id,
                        expectedRevision: poll.voteRevision,
                      }),
                    'Vote removed.'
                  ),
              })
            }
          >
            Remove my vote
          </Button>
        </>
      ) : null}
      {poll.canManage ? (
        <Button
          accessibilityLabel='Manage Group poll'
          onPress={() =>
            router.push(`/groups/${groupId}/polls/${poll._id}/manage`)
          }
        >
          Manage poll
        </Button>
      ) : null}
      {poll.canReview ? (
        <Button
          accessibilityLabel='View Group poll results'
          onPress={() =>
            router.push(`/groups/${groupId}/polls/${poll._id}/results`)
          }
        >
          Results
        </Button>
      ) : null}
      {message ? <Text accessibilityRole='alert'>{message}</Text> : null}
    </View>
  );
}
export function GroupOrdinaryPollResults({
  groupId,
  toolId,
}: {
  groupId: GroupId;
  toolId: ToolId;
}) {
  return (
    <OrdinaryPollGate groupId={groupId}>
      <ResultsLoader groupId={groupId} toolId={toolId} />
    </OrdinaryPollGate>
  );
}
function ResultsLoader({
  groupId,
  toolId,
}: {
  groupId: GroupId;
  toolId: ToolId;
}) {
  const poll = hooks.usePoll({ toolId });
  if (!poll) return <Text>Loading result permissions…</Text>;
  if (poll.groupId !== groupId || !poll.canReview)
    return <Text>Results are private to Group managers.</Text>;
  return <VoteRecords toolId={toolId} canManage={poll.canManage} />;
}
export function GroupOrdinaryPollHistory({ toolId }: { toolId: ToolId }) {
  return <VoteRecords toolId={toolId} history />;
}
function VoteRecords({
  toolId,
  history = false,
  canManage = false,
}: {
  toolId: ToolId;
  history?: boolean;
  canManage?: boolean;
}) {
  const [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const args = { toolId, paginationOpts: { numItems: 20, cursor } };
  const own = hooks.usePollHistory(history ? args : 'skip');
  const results = hooks.usePollResults(history ? 'skip' : args);
  const page = history ? own : results;
  const remove = hooks.useRemovePollResult();
  const removeOwn = hooks.useRemovePollVote();

  return (
    <View className='gap-3'>
      <Text>
        Saved votes retain their original option definitions. Results show votes
        on this page, never a Group-wide total.
      </Text>
      {page === undefined ? (
        <Text>Loading saved votes…</Text>
      ) : page.page.length === 0 ? (
        <Text>No saved votes on this page.</Text>
      ) : (
        page.page.map(record => (
          <View
            key={record._id}
            className='gap-2 rounded-card border border-border p-3'
          >
            <Text>
              {record.personId ? 'Member vote' : 'Anonymous vote'} · revision{' '}
              {record.revision} · poll version {record.version}
            </Text>
            {!history && 'isCurrent' in record ? (
              <Text>
                {record.removed
                  ? 'Removed vote'
                  : record.isCurrent
                    ? 'Current vote'
                    : 'Historical vote: no longer counts under the current rule'}
              </Text>
            ) : null}
            {record.options
              .filter(option => record.selections.includes(option.id))
              .map(option => (
                <Text key={option.id}>{option.label}</Text>
              ))}
            <Text>{new Date(record.updatedAt).toLocaleString()}</Text>
            {!history &&
            'isCurrent' in record &&
            !record.removed &&
            canManage ? (
              <Button
                accessibilityLabel={`Remove poll result ${record._id}`}
                disabled={busy}
                onPress={() =>
                  showConfirmDialog({
                    title: 'Remove result?',
                    message:
                      'This permanently removes the vote. Identified vote history is also removed.',
                    destructive: true,
                    onConfirm: () => {
                      setBusy(true);
                      void remove({
                        voteId: record._id,
                        expectedRevision: record.revision,
                      })
                        .then(() => setMessage('Result removed.'))
                        .catch(error =>
                          setMessage(
                            error instanceof Error
                              ? error.message
                              : 'Could not remove result.'
                          )
                        )
                        .finally(() => setBusy(false));
                    },
                  })
                }
              >
                Remove result
              </Button>
            ) : null}
          </View>
        ))
      )}
      {history && own && own.voteRevision > 0 ? (
        <Button
          accessibilityLabel='Remove my saved poll history'
          disabled={busy}
          onPress={() =>
            showConfirmDialog({
              title: 'Remove your vote and history?',
              message: 'Your latest vote and private history will be removed.',
              destructive: true,
              onConfirm: () => {
                setBusy(true);
                void removeOwn({ toolId, expectedRevision: own.voteRevision })
                  .then(() => setMessage('Vote and history removed.'))
                  .catch(error =>
                    setMessage(
                      error instanceof Error
                        ? error.message
                        : 'Could not remove vote.'
                    )
                  )
                  .finally(() => setBusy(false));
              },
            })
          }
        >
          Remove my vote and history
        </Button>
      ) : null}
      <GroupPageControls
        page={page}
        cursor={cursor}
        onPage={setCursor}
        label={history ? 'Poll history' : 'Poll results'}
      />
      {message ? <Text accessibilityRole='alert'>{message}</Text> : null}
    </View>
  );
}
