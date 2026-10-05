'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { groupListTemplates, listEntryRequestId } from '@groupi/shared/utils';
import { useGroup } from '@/hooks/convex/use-groups';
import * as hooks from '@/hooks/convex/use-group-lists';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GroupConfirmedAction } from './group-confirmed-action';
function failure(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Unable to save. Inspect current state before retrying.';
}
export function GroupLists({ groupId }: { groupId: Id<'groups'> }) {
  const group = useGroup(groupId);
  const policy = hooks.useListPolicy({ groupId });
  const configure = hooks.useConfigureListPolicy();
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState('');
  const eligible =
    group && group.joiningQuestionnaire?.canAccessMemberContent !== false;
  const manager =
    group?.viewerRole === 'OWNER' || group?.viewerRole === 'MODERATOR';
  const lists = hooks.useLists(
    eligible && (policy?.enabled || manager)
      ? { groupId, paginationOpts: { numItems: 20, cursor } }
      : 'skip'
  );
  if (!group || !policy) return <p role='status'>Loading lists…</p>;
  return (
    <main className='p-6 space-y-4'>
      <h1>Community lists</h1>
      <p>
        Ongoing community contributions, independent of Invite Lists and Event
        Bring Lists. Marking complete is a list status only.
      </p>
      {policy.canConfigure && (
        <section className='space-y-3' aria-label='List owner policy'>
          <h2>Owner policy</h2>
          <Button
            onClick={async () => {
              try {
                await configure({
                  groupId,
                  enabled: !policy.enabled,
                  creation: policy.creation,
                });
              } catch (e) {
                setError(failure(e));
              }
            }}
          >
            {policy.enabled ? 'Disable lists' : 'Enable lists'}
          </Button>
          <Label htmlFor='list-creation'>Who can create lists?</Label>
          <select
            id='list-creation'
            value={policy.creation}
            onChange={async e => {
              try {
                await configure({
                  groupId,
                  enabled: policy.enabled,
                  creation:
                    e.target.value === 'MEMBERS' ? 'MEMBERS' : 'MANAGERS',
                });
              } catch (error) {
                setError(failure(error));
              }
            }}
          >
            <option value='MANAGERS'>Owners and moderators</option>
            <option value='MEMBERS'>Any eligible member</option>
          </select>
        </section>
      )}
      {!eligible ? (
        <p>
          Complete required onboarding before accessing community lists. Your
          own saved entries remain available by their original link.
        </p>
      ) : (
        <>
          {!policy.enabled && (
            <p>
              Lists are disabled. Eligible managers may manage preserved
              settings.
            </p>
          )}
          {policy.enabled && (manager || policy.creation === 'MEMBERS') && (
            <Link
              className='text-primary underline'
              href={`/groups/${groupId}/lists/new`}
            >
              Create list
            </Link>
          )}
          {lists?.page.map(list => (
            <div
              className='rounded-card border border-border p-4'
              key={list._id}
            >
              <Link
                className='text-primary underline'
                href={`/groups/${groupId}/lists/${list._id}${policy.enabled ? '' : '/settings'}`}
              >
                {policy.enabled ? list.title : `Manage ${list.title}`}
              </Link>
              <p>{list.description}</p>
              {manager && policy.enabled && (
                <Link
                  className='text-primary underline'
                  href={`/groups/${groupId}/lists/${list._id}/settings`}
                >
                  Manage {list.title}
                </Link>
              )}
            </div>
          ))}
          {lists && !lists.isDone && (
            <Button onClick={() => setCursor(lists.continueCursor)}>
              Next lists
            </Button>
          )}
        </>
      )}
      {error && <p role='alert'>{error}</p>}
    </main>
  );
}
export function GroupListEditor({
  groupId,
  toolId,
}: {
  groupId: Id<'groups'>;
  toolId?: Id<'groupTools'>;
}) {
  const group = useGroup(groupId);
  const policy = hooks.useListPolicy({ groupId });
  const manager =
    group?.viewerRole === 'OWNER' || group?.viewerRole === 'MODERATOR';
  const eligible =
    group && group.joiningQuestionnaire?.canAccessMemberContent !== false;
  const list = hooks.useListManagement(
    toolId && manager && eligible ? { toolId } : 'skip'
  );
  if (group === undefined || policy === undefined)
    return <p role='status'>Loading list settings…</p>;
  if (
    !eligible ||
    (toolId && !manager) ||
    (!toolId &&
      (!policy.enabled || (policy.creation === 'MANAGERS' && !manager)))
  )
    return (
      <p role='alert'>
        List management requires current role, owner policy and completed
        onboarding.
      </p>
    );
  if (toolId && !list) return <p role='status'>Loading preserved list…</p>;
  if (list && list.groupId !== groupId)
    return <p role='alert'>List unavailable in this Group.</p>;
  return (
    <ListEditor key={list?.version ?? 'new'} groupId={groupId} list={list} />
  );
}
function ListEditor({
  groupId,
  list,
}: {
  groupId: Id<'groups'>;
  list: ReturnType<typeof hooks.useListManagement>;
}) {
  const create = hooks.useCreateList();
  const configure = hooks.useConfigureList();
  const remove = hooks.useDeleteList();
  const router = useRouter();
  const [title, setTitle] = useState(list?.title ?? 'New community list');
  const [description, setDescription] = useState(list?.description ?? '');
  const [visibility, setVisibility] = useState<'MANAGERS' | 'MEMBERS'>(
    list?.resultsVisibility ?? 'MEMBERS'
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <main className='p-6 space-y-4'>
      <h1>{list ? 'Manage list' : 'Create list'}</h1>
      {!list && (
        <div aria-label='Reusable list templates'>
          {groupListTemplates.map(template => (
            <Button
              key={template.id}
              variant='outline'
              onClick={() => {
                setTitle(template.title);
                setDescription(template.description);
              }}
            >
              Use {template.id} template
            </Button>
          ))}
        </div>
      )}
      <form
        className='space-y-3'
        onSubmit={async e => {
          e.preventDefault();
          setBusy(true);
          try {
            if (list) {
              await configure({
                toolId: list._id,
                version: list.version,
                title,
                description,
              });
              router.push(`/groups/${groupId}/lists`);
            } else {
              const id = await create({
                groupId,
                title,
                description,
                resultsVisibility: visibility,
              });
              router.push(`/groups/${groupId}/lists/${id}`);
            }
          } catch (e) {
            setError(
              failure(e) +
                ' Inspect the list before repeating an uncertain creation.'
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <Label htmlFor='community-list-title'>List title</Label>
        <Input
          id='community-list-title'
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          maxLength={100}
          disabled={busy}
        />
        <Label htmlFor='community-list-description'>List description</Label>
        <Input
          id='community-list-description'
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={2000}
          disabled={busy}
        />
        {!list && (
          <>
            <Label htmlFor='community-list-visibility'>
              Entry visibility (fixed)
            </Label>
            <select
              id='community-list-visibility'
              value={visibility}
              onChange={e =>
                setVisibility(
                  e.target.value === 'MANAGERS' ? 'MANAGERS' : 'MEMBERS'
                )
              }
              disabled={busy}
            >
              <option value='MEMBERS'>Shared with eligible members</option>
              <option value='MANAGERS'>Personal to authors and managers</option>
            </select>
          </>
        )}
        <p>
          Title/description edits preserve entries and their original saved list
          title. Authors edit their entries; eligible managers can edit or
          remove any entry.
        </p>
        <Button disabled={busy}>
          {list ? 'Save list settings' : 'Create list'}
        </Button>
      </form>
      {list && (
        <GroupConfirmedAction
          label='Delete list'
          confirmation='Confirm deleting list and all entries'
          explanation='All list configuration, entries and retry records are permanently removed.'
          onConfirm={async () => {
            await remove({ toolId: list._id });
            router.push(`/groups/${groupId}/lists`);
          }}
        />
      )}
      {error && <p role='alert'>{error}</p>}
    </main>
  );
}
export function GroupListInteraction({
  groupId,
  toolId,
}: {
  groupId: Id<'groups'>;
  toolId: Id<'groupTools'>;
}) {
  const group = useGroup(groupId);
  const policy = hooks.useListPolicy({ groupId });
  const eligible =
    group && group.joiningQuestionnaire?.canAccessMemberContent !== false;
  const list = hooks.useList(eligible && policy?.enabled ? { toolId } : 'skip');
  return (
    <main className='p-6 space-y-4'>
      <Link
        className='text-primary underline'
        href={`/groups/${groupId}/lists/${toolId}/own`}
      >
        My saved list entries
      </Link>
      {!eligible || (policy && !policy.enabled) ? (
        <p role='alert'>
          Complete required onboarding and use enabled lists to contribute. Own
          saved entries remain available.
        </p>
      ) : !list ? (
        <p role='status'>Loading list…</p>
      ) : list.groupId !== groupId ? (
        <p role='alert'>List unavailable in this Group.</p>
      ) : (
        <ListInteraction groupId={groupId} list={list} />
      )}
    </main>
  );
}
function ListInteraction({
  groupId,
  list,
}: {
  groupId: Id<'groups'>;
  list: NonNullable<ReturnType<typeof hooks.useList>>;
}) {
  const add = hooks.useAddListEntry();
  const [text, setText] = useState('');
  const [attempt, setAttempt] = useState<Parameters<typeof add>[0] | null>(
    null
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  return (
    <section className='space-y-4'>
      <h1>{list.title}</h1>
      <p>{list.description}</p>
      <p>
        {list.resultsVisibility === 'MEMBERS'
          ? 'Shared entries are visible to eligible members. On account deletion, latest shared entries survive anonymously; retry records are purged.'
          : 'Personal entries are visible only to their author and current eligible managers. Account deletion purges personal entries and retry records.'}{' '}
        Authors edit/remove their entries. Managers may moderate any entry.
        Completion is a list status, with no Event commitment.
      </p>
      <form
        className='space-y-3'
        onSubmit={async e => {
          e.preventDefault();
          const input = attempt ?? {
            toolId: list._id,
            version: list.version,
            requestId: listEntryRequestId(),
            text,
          };
          setAttempt(input);
          setBusy(true);
          try {
            const result = await add(input);
            setMessage(
              result.state === 'PRESENT'
                ? 'Entry saved.'
                : 'Original entry was removed; it was not recreated.'
            );
            setAttempt(null);
            setText('');
          } catch (error) {
            setMessage(
              failure(error) +
                ' Retry preserves the same request and original content. Inspect saved entries before starting another request.'
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <Label htmlFor='community-list-entry'>New entry</Label>
        <Input
          id='community-list-entry'
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={2000}
          required
          disabled={busy || Boolean(attempt)}
        />
        <Button disabled={busy}>
          {attempt ? 'Retry original entry' : 'Add entry'}
        </Button>
      </form>
      {attempt && <p>Request ID: {attempt.requestId}</p>}
      {message && <p role='status'>{message}</p>}
      {list.canManage && (
        <Link
          className='text-primary underline'
          href={`/groups/${groupId}/lists/${list._id}/settings`}
        >
          Manage list settings
        </Link>
      )}
      <GroupListEntries toolId={list._id} version={list.version} />
    </section>
  );
}
function GroupListEntries({
  toolId,
  version,
}: {
  toolId: Id<'groupTools'>;
  version: number;
}) {
  const [cursor, setCursor] = useState<string | null>(null);
  const entries = hooks.useListEntries({
    toolId,
    paginationOpts: { numItems: 20, cursor },
  });
  return (
    <section className='space-y-3'>
      <h2>Current entries</h2>
      {entries?.page.map(entry => (
        <EntryEditor
          key={`${entry._id}:${entry.revision}:${version}`}
          entry={entry}
          version={version}
        />
      ))}
      {entries && !entries.isDone && (
        <Button onClick={() => setCursor(entries.continueCursor)}>
          Next entries
        </Button>
      )}
    </section>
  );
}
function EntryEditor({
  entry,
  version,
}: {
  entry: NonNullable<ReturnType<typeof hooks.useListEntries>>['page'][number];
  version: number;
}) {
  const edit = hooks.useEditListEntry();
  const remove = hooks.useRemoveListEntry();
  const [text, setText] = useState(entry.text);
  const [completed, setCompleted] = useState(entry.completed);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <article className='rounded-card border border-border p-4 space-y-3'>
      <p>
        {entry.personId ? 'Member contribution' : 'Anonymous contribution'} ·
        revision {entry.revision}
      </p>
      {entry.canEdit ? (
        <form
          className='space-y-3'
          onSubmit={async e => {
            e.preventDefault();
            setBusy(true);
            try {
              await edit({
                entryId: entry._id,
                version,
                expectedRevision: entry.revision,
                text,
                completed,
              });
              setError('Entry updated.');
            } catch (error) {
              setError(failure(error));
            } finally {
              setBusy(false);
            }
          }}
        >
          <Label htmlFor={`entry-${entry._id}`}>Entry text</Label>
          <Input
            id={`entry-${entry._id}`}
            value={text}
            onChange={e => setText(e.target.value)}
            required
            maxLength={2000}
            disabled={busy}
          />
          <label>
            <input
              type='checkbox'
              checked={completed}
              onChange={e => setCompleted(e.target.checked)}
              disabled={busy}
            />
            Completed
          </label>
          <Button disabled={busy}>Save entry</Button>
        </form>
      ) : (
        <p>
          {entry.text} · {entry.completed ? 'Completed' : 'Open'}
        </p>
      )}
      {entry.canRemove && (
        <GroupConfirmedAction
          label='Remove entry'
          confirmation='Confirm removing this entry'
          explanation='This contribution is removed. Its original add request will recover as removed until expiry.'
          onConfirm={() =>
            remove({ entryId: entry._id, expectedRevision: entry.revision })
          }
        />
      )}{' '}
      {error && <p role='status'>{error}</p>}
    </article>
  );
}
export function GroupListOwnEntries({ toolId }: { toolId: Id<'groupTools'> }) {
  const [cursor, setCursor] = useState<string | null>(null);
  const entries = hooks.useOwnListEntries({
    toolId,
    paginationOpts: { numItems: 20, cursor },
  });
  const remove = hooks.useRemoveListEntry();
  return (
    <main className='p-6 space-y-3'>
      <h1>My saved list entries</h1>
      <p>
        Your own retained contributions and their original list title. Current
        private list settings are not loaded.
      </p>
      {entries?.page.map(entry => (
        <article
          key={entry._id}
          className='rounded-card border border-border p-4'
        >
          <h2>{entry.listTitle}</h2>
          <p>
            {entry.text} · {entry.completed ? 'Completed' : 'Open'}
          </p>
          <GroupConfirmedAction
            label='Remove my entry'
            confirmation='Confirm removing my saved entry'
            explanation='This removes your retained contribution.'
            onConfirm={() =>
              remove({ entryId: entry._id, expectedRevision: entry.revision })
            }
          />
        </article>
      ))}
      {entries && !entries.isDone && (
        <Button onClick={() => setCursor(entries.continueCursor)}>
          Next saved entries
        </Button>
      )}
    </main>
  );
}
