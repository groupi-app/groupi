import { useState, type ReactNode } from 'react';
import { View, TextInput } from 'react-native';
import { router } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { groupListTemplates, listEntryRequestId } from '@groupi/shared/utils';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { useGroup } from '@/hooks/use-groups';
import * as hooks from '@/hooks/use-group-lists';
import { GroupPageControls } from './group-page-controls';
type GroupId = Id<'groups'>;
type ToolId = Id<'groupTools'>;
type List = NonNullable<ReturnType<typeof hooks.useList>>;
type Entry = NonNullable<
  ReturnType<typeof hooks.useListEntries>
>['page'][number];
function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'The action could not be saved. Try again.';
}
function ListGate({
  groupId,
  children,
  management = false,
}: {
  groupId: GroupId;
  children: ReactNode;
  management?: boolean;
}) {
  const group = useGroup(groupId);
  const policy = hooks.useListPolicy(group ? { groupId } : 'skip');
  if (group === undefined) return <Text>Loading Group…</Text>;
  if (!group)
    return (
      <Text>
        Current Group membership is required. Use your saved entries link for
        personal recovery.
      </Text>
    );
  if (group.joiningQuestionnaire?.canAccessMemberContent === false)
    return (
      <View className='gap-3'>
        <Text>Complete required onboarding before accessing Group lists.</Text>
        <Button
          accessibilityLabel='Complete required Group onboarding'
          onPress={() => router.push(`/groups/${groupId}/questionnaire`)}
        >
          Complete onboarding
        </Button>
      </View>
    );
  if (policy === undefined) return <Text>Loading lists policy…</Text>;
  if (!policy.enabled && !(management && group.canManageMembers))
    return (
      <Text>
        Lists are disabled. Your own saved entries remain available through
        their direct link.
      </Text>
    );
  return <>{children}</>;
}
export function GroupListsHub({ groupId }: { groupId: GroupId }) {
  return (
    <View className='gap-3'>
      <Button
        accessibilityLabel='Group list policy'
        onPress={() => router.push(`/groups/${groupId}/lists/policy`)}
      >
        Lists policy
      </Button>
      <ListGate groupId={groupId} management>
        <Lists groupId={groupId} />
      </ListGate>
    </View>
  );
}
function Lists({ groupId }: { groupId: GroupId }) {
  const [cursor, setCursor] = useState<string | null>(null);
  const page = hooks.useLists({
    groupId,
    paginationOpts: { numItems: 20, cursor },
  });
  const policy = hooks.useListPolicy({ groupId });
  const group = useGroup(groupId);
  return (
    <View className='gap-3'>
      {policy && !policy.enabled ? (
        <Text>
          Lists are disabled. Eligible managers can manage preserved
          configurations.
        </Text>
      ) : null}
      {policy?.enabled &&
      (policy.creation === 'MEMBERS' || group?.canManageMembers) ? (
        <Button
          accessibilityLabel='Create Group list'
          onPress={() => router.push(`/groups/${groupId}/lists/create`)}
        >
          Create list
        </Button>
      ) : null}
      {page === undefined ? (
        <Text>Loading lists…</Text>
      ) : page.page.length === 0 ? (
        <Text>No lists on this page.</Text>
      ) : (
        page.page.map(list => (
          <Button
            key={list._id}
            accessibilityLabel={`${policy?.enabled ? 'Open' : 'Manage'} list ${list.title}`}
            onPress={() =>
              router.push(
                `/groups/${groupId}/lists/${list._id}${policy?.enabled ? '' : '/manage'}`
              )
            }
          >
            {list.title}
          </Button>
        ))
      )}
      <GroupPageControls
        page={page}
        cursor={cursor}
        onPage={setCursor}
        label='Lists'
      />
    </View>
  );
}
export function GroupListPolicy({ groupId }: { groupId: GroupId }) {
  const policy = hooks.useListPolicy({ groupId });
  const configure = hooks.useConfigureListPolicy();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  if (!policy) return <Text>Loading lists policy…</Text>;
  if (!policy.canConfigure)
    return <Text>Only the Group owner can configure lists policy.</Text>;
  async function save(enabled: boolean, creation: 'MANAGERS' | 'MEMBERS') {
    setBusy(true);
    try {
      await configure({ groupId, enabled, creation });
      setNotice('Lists policy saved.');
    } catch (error) {
      setNotice(message(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <View className='gap-3'>
      <Text>
        Lists {policy.enabled ? 'enabled' : 'disabled'}. Creation:{' '}
        {policy.creation === 'MEMBERS'
          ? 'eligible members'
          : 'eligible managers'}
        . Contributions remain independent of Events and Invite Lists.
      </Text>
      <Button
        disabled={busy}
        accessibilityLabel={
          policy.enabled ? 'Disable Group lists' : 'Enable Group lists'
        }
        onPress={() => save(!policy.enabled, policy.creation)}
      >
        {policy.enabled ? 'Disable' : 'Enable'} lists
      </Button>
      <Button
        disabled={busy}
        accessibilityLabel='Allow eligible members to create lists'
        onPress={() => save(policy.enabled, 'MEMBERS')}
      >
        Allow member creation
      </Button>
      <Button
        disabled={busy}
        accessibilityLabel='Limit list creation to managers'
        onPress={() => save(policy.enabled, 'MANAGERS')}
      >
        Managers create lists
      </Button>
      {notice ? <Text accessibilityRole='alert'>{notice}</Text> : null}
    </View>
  );
}
export function GroupListEditor({
  groupId,
  toolId,
}: {
  groupId: GroupId;
  toolId?: ToolId;
}) {
  return (
    <ListGate groupId={groupId} management={!!toolId}>
      {toolId ? (
        <ExistingEditor groupId={groupId} toolId={toolId} />
      ) : (
        <CreateEditor groupId={groupId} />
      )}
    </ListGate>
  );
}
function CreateEditor({ groupId }: { groupId: GroupId }) {
  const group = useGroup(groupId);
  const policy = hooks.useListPolicy({ groupId });
  if (!group || !policy) return <Text>Loading creation permissions…</Text>;
  if (policy.creation === 'MANAGERS' && !group.canManageMembers)
    return <Text>Only eligible managers can create Group lists.</Text>;
  return <Editor groupId={groupId} />;
}
function ExistingEditor({
  groupId,
  toolId,
}: {
  groupId: GroupId;
  toolId: ToolId;
}) {
  const list = hooks.useListManagement({ toolId });
  return list ? (
    <Editor key={`${toolId}:${list.version}`} groupId={groupId} list={list} />
  ) : (
    <Text>Loading list settings…</Text>
  );
}
function Editor({ groupId, list }: { groupId: GroupId; list?: List }) {
  const create = hooks.useCreateList(),
    configure = hooks.useConfigureList(),
    remove = hooks.useDeleteList();
  const [title, setTitle] = useState(list?.title ?? '');
  const [description, setDescription] = useState(list?.description ?? '');
  const [visibility, setVisibility] = useState<'MANAGERS' | 'MEMBERS'>(
    list?.resultsVisibility ?? 'MEMBERS'
  );
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState('');
  if (list && !list.canManage)
    return <Text>Current eligible manager access is required.</Text>;
  async function save() {
    setBusy(true);
    try {
      if (list) {
        await configure({
          toolId: list._id,
          version: list.version,
          title,
          description,
        });
        setNotice('List settings saved.');
      } else {
        const id = await create({
          groupId,
          title,
          description,
          resultsVisibility: visibility,
        });
        router.replace(`/groups/${groupId}/lists/${id}`);
      }
    } catch (error) {
      setNotice(message(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <View className='gap-3'>
      <Text>
        {list ? 'Manage list configuration' : 'Create persistent Group list'}
      </Text>
      {!list
        ? groupListTemplates.map(template => (
            <Button
              key={template.id}
              accessibilityLabel={`Use list template ${template.title}`}
              onPress={() => {
                setTitle(template.title);
                setDescription(template.description);
              }}
            >
              {template.title}
            </Button>
          ))
        : null}
      <TextInput
        accessibilityLabel='List title'
        maxLength={100}
        className='border border-border rounded-input p-3 text-foreground'
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        accessibilityLabel='List description'
        maxLength={2000}
        multiline
        className='border border-border rounded-input p-3 text-foreground'
        value={description}
        onChangeText={setDescription}
      />
      <Text>
        Visibility is fixed at creation.{' '}
        {visibility === 'MEMBERS'
          ? 'Eligible members can see all entries; shared contributions may remain anonymous after account deletion.'
          : 'Only managers see everyone’s entries; members see their own. Private personal records are removed on account deletion.'}
      </Text>
      {!list ? (
        <>
          <Button
            accessibilityLabel='List visible to members'
            onPress={() => setVisibility('MEMBERS')}
          >
            Members see results
          </Button>
          <Button
            accessibilityLabel='List visible to managers'
            onPress={() => setVisibility('MANAGERS')}
          >
            Managers see results
          </Button>
        </>
      ) : null}
      <Button
        disabled={busy || !title.trim()}
        accessibilityLabel='Save Group list'
        onPress={save}
      >
        Save list
      </Button>
      {list ? (
        <Button
          disabled={busy}
          variant='destructive'
          accessibilityLabel='Delete Group list'
          onPress={() =>
            showConfirmDialog({
              title: 'Delete list?',
              message: 'Remove this persistent list and its entries.',
              destructive: true,
              onConfirm: () => {
                setBusy(true);
                void remove({ toolId: list._id })
                  .then(() => router.replace(`/groups/${groupId}/lists`))
                  .catch(error => setNotice(message(error)))
                  .finally(() => setBusy(false));
              },
            })
          }
        >
          Delete list
        </Button>
      ) : null}
      {notice ? <Text accessibilityRole='alert'>{notice}</Text> : null}
    </View>
  );
}
export function GroupPersistentList({
  groupId,
  toolId,
}: {
  groupId: GroupId;
  toolId: ToolId;
}) {
  return (
    <View className='gap-3'>
      <Button
        accessibilityLabel='My saved list entries'
        onPress={() => router.push(`/groups/${groupId}/lists/${toolId}/own`)}
      >
        My saved entries
      </Button>
      <ListGate groupId={groupId}>
        <CurrentList groupId={groupId} toolId={toolId} />
      </ListGate>
    </View>
  );
}
function CurrentList({
  groupId,
  toolId,
}: {
  groupId: GroupId;
  toolId: ToolId;
}) {
  const list = hooks.useList({ toolId });
  const add = hooks.useAddListEntry();
  const [text, setText] = useState(''),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState<{
    requestId: string;
    text: string;
    version: number;
  } | null>(null);
  if (!list) return <Text>Loading list…</Text>;
  async function submit() {
    if (!list) return;
    const body = attempt ?? {
      requestId: listEntryRequestId(),
      text,
      version: list.version,
    };
    setAttempt(body);
    setBusy(true);
    try {
      const result = await add({ toolId, ...body });
      setNotice(
        result.state === 'REMOVED'
          ? 'This request already succeeded; its entry was removed.'
          : 'Entry saved.'
      );
      setAttempt(null);
      setText('');
    } catch (error) {
      setNotice(
        `${message(error)} Retry uses the same saved request. Inspect your entries before starting a new request; requests expire after 24 hours.`
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <View className='gap-3'>
      <Text>{list.title}</Text>
      <Text>{list.description}</Text>
      <Text>
        {list.resultsVisibility === 'MANAGERS'
          ? 'Managers see all entries; other members see only their own.'
          : 'Eligible members see all entries. Deleted authors appear anonymous.'}{' '}
        Completion is a list status, not an Event commitment. You can
        edit/remove your contributions; eligible managers moderate any.
      </Text>
      {list.canManage ? (
        <Button
          accessibilityLabel='Manage Group list'
          onPress={() =>
            router.push(`/groups/${groupId}/lists/${toolId}/manage`)
          }
        >
          Manage configuration
        </Button>
      ) : null}
      <TextInput
        accessibilityLabel='New list entry'
        editable={!attempt && !busy}
        maxLength={2000}
        className='border border-border rounded-input p-3 text-foreground'
        value={attempt?.text ?? text}
        onChangeText={setText}
      />
      <Button
        disabled={busy || !(attempt?.text ?? text).trim()}
        accessibilityLabel={
          attempt ? 'Retry saved list entry' : 'Add list entry'
        }
        onPress={submit}
      >
        {attempt ? 'Retry saved entry' : 'Add entry'}
      </Button>
      {attempt ? (
        <Button
          accessibilityLabel='Start a new list entry after inspection'
          disabled={busy}
          onPress={() =>
            showConfirmDialog({
              title: 'Start a new request?',
              message:
                'Inspect saved entries first. A previous request may have succeeded; using a new request can create a duplicate.',
              onConfirm: () => {
                setAttempt(null);
                setNotice(
                  'Enter a new contribution after inspecting saved entries.'
                );
              },
            })
          }
        >
          Start new request after inspection
        </Button>
      ) : null}
      {notice ? <Text accessibilityRole='alert'>{notice}</Text> : null}
      <Entries toolId={toolId} list={list} />
    </View>
  );
}
export function GroupOwnListEntries({ toolId }: { toolId: ToolId }) {
  return (
    <View className='gap-3'>
      <Text>My retained entries</Text>
      <Text>
        These are your saved snapshots. Current private configuration is not
        loaded. You may remove your own entries.
      </Text>
      <Entries toolId={toolId} own />
    </View>
  );
}
function Entries({
  toolId,
  list,
  own = false,
}: {
  toolId: ToolId;
  list?: List;
  own?: boolean;
}) {
  const [cursor, setCursor] = useState<string | null>(null);
  const args = { toolId, paginationOpts: { numItems: 20, cursor } };
  const ordinary = hooks.useListEntries(own ? 'skip' : args),
    personal = hooks.useOwnListEntries(own ? args : 'skip');
  const page = own ? personal : ordinary;
  return (
    <View className='gap-3'>
      {page === undefined ? (
        <Text>Loading entries…</Text>
      ) : page.page.length === 0 ? (
        <Text>No entries on this page.</Text>
      ) : (
        page.page.map(entry => (
          <EntryRow
            key={`${entry._id}:${entry.revision}`}
            entry={entry}
            list={list}
            canEdit={!own && entry.canEdit}
            canRemove={entry.canRemove}
          />
        ))
      )}
      <GroupPageControls
        page={page}
        cursor={cursor}
        onPage={setCursor}
        label='List entries'
      />
    </View>
  );
}
function EntryRow({
  entry,
  list,
  canEdit,
  canRemove,
}: {
  entry: Entry;
  list?: List;
  canEdit: boolean;
  canRemove: boolean;
}) {
  const edit = hooks.useEditListEntry(),
    remove = hooks.useRemoveListEntry();
  const [text, setText] = useState(entry.text),
    [completed, setCompleted] = useState(entry.completed),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState('');
  async function save() {
    if (!list) return;
    setBusy(true);
    try {
      await edit({
        entryId: entry._id,
        version: list.version,
        expectedRevision: entry.revision,
        text,
        completed,
      });
      setNotice('Entry saved.');
    } catch (error) {
      setNotice(message(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <View className='gap-2 border border-border rounded-card p-3'>
      <Text>{entry.listTitle}</Text>
      <Text>
        {entry.personId ? 'Member contribution' : 'Anonymous contribution'}
      </Text>
      {canEdit ? (
        <>
          <TextInput
            accessibilityLabel={`Edit entry ${entry.text}`}
            editable={!busy}
            value={text}
            maxLength={2000}
            onChangeText={setText}
            className='border border-border rounded-input p-3 text-foreground'
          />
          <Button
            disabled={busy}
            role='checkbox'
            accessibilityRole='checkbox'
            accessibilityState={{ checked: completed }}
            accessibilityLabel={`Completed: ${entry.text}`}
            onPress={() => setCompleted(!completed)}
          >
            {completed ? 'Completed' : 'Not completed'}
          </Button>
          <Button
            disabled={busy || !text.trim()}
            accessibilityLabel={`Save entry ${entry.text}`}
            onPress={save}
          >
            Save entry
          </Button>
        </>
      ) : (
        <>
          <Text>{entry.text}</Text>
          <Text>{entry.completed ? 'Completed' : 'Not completed'}</Text>
        </>
      )}
      {canRemove ? (
        <Button
          disabled={busy}
          accessibilityLabel={`Remove entry ${entry.text}`}
          variant='destructive'
          onPress={() =>
            showConfirmDialog({
              title: 'Remove entry?',
              message: entry.text,
              destructive: true,
              onConfirm: () => {
                setBusy(true);
                void remove({
                  entryId: entry._id,
                  expectedRevision: entry.revision,
                })
                  .then(() => setNotice('Entry removed.'))
                  .catch(error => setNotice(message(error)))
                  .finally(() => setBusy(false));
              },
            })
          }
        >
          Remove entry
        </Button>
      ) : null}
      {notice ? <Text accessibilityRole='alert'>{notice}</Text> : null}
    </View>
  );
}
