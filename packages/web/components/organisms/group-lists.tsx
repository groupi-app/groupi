'use client';
import { MoreHorizontal, Pencil, Plus, Settings } from 'lucide-react';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { listEntryRequestId } from '@groupi/shared/utils';
import {
  useToolOwner as useGroup,
  useContentBase,
  type ContentOwnerId,
} from '@/features/content/tool-scope';
import * as hooks from '@/hooks/convex/use-group-lists';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ContentPage } from '@/features/content/content-design';
import { Label } from '@/components/ui/label';
import { GroupConfirmedAction } from './group-confirmed-action';
const listCard =
  'mx-auto w-full min-w-0 max-w-md space-y-3 rounded-card border border-border bg-card p-4 text-foreground';
const titleField =
  'min-h-8 resize-none border-transparent bg-transparent px-0 font-heading text-base font-semibold leading-snug field-sizing-content';
const descriptionField =
  'min-h-8 resize-y border-transparent bg-transparent px-0 text-sm leading-relaxed field-sizing-content';
function failure(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Unable to save. Inspect current state before retrying.';
}
export function GroupLists({ groupId }: { groupId: ContentOwnerId }) {
  const base = useContentBase(groupId);
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
    <ContentPage>
      <h1 className='font-heading'>
        {base.startsWith('/event/') ? 'Event lists' : 'Community lists'}
      </h1>
      <p>
        Keep shared plans and contributions together. Marking complete is a list
        status only.
      </p>
      {base.startsWith('/event/') && (
        <Link
          className='text-primary underline'
          href={`${base}/addon/bring-list`}
        >
          Open existing Bring List and item claims
        </Link>
      )}
      {policy.canConfigure && (
        <section className='space-y-3' aria-label='List owner policy'>
          <h2 className='font-heading'>Owner policy</h2>
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
          {policy.enabled &&
            policy.canCreate !== false &&
            (manager || policy.creation === 'MEMBERS') && (
              <Link
                className='text-primary underline'
                href={`${base}/lists/new`}
              >
                Create list
              </Link>
            )}
          {lists === undefined && (policy.enabled || manager) ? (
            <p role='status'>Loading lists…</p>
          ) : lists?.page.length === 0 ? (
            <p className='rounded-card border border-dashed border-border p-6 text-muted-foreground'>
              No lists yet. Create a list to gather contributions.
            </p>
          ) : null}
          {lists?.page.map(list => (
            <div
              className='rounded-card border border-border p-4'
              key={list._id}
            >
              <Link
                className='text-primary underline'
                href={`${base}/lists/${list._id}${policy.enabled ? '' : '/settings'}`}
              >
                {policy.enabled ? list.title : `Manage ${list.title}`}
              </Link>
              <p>{list.description}</p>
              {manager && policy.enabled && (
                <Link
                  className='text-primary underline'
                  href={`${base}/lists/${list._id}/settings`}
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
export function GroupListEditor({
  groupId,
  toolId,
}: {
  groupId: ContentOwnerId;
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
      (policy.canCreate === false ||
        !policy.enabled ||
        (policy.creation === 'MANAGERS' && !manager)))
  )
    return (
      <p role='alert'>
        List management requires current role, owner policy and completed
        onboarding.
      </p>
    );
  if (toolId && !list) return <p role='status'>Loading preserved list…</p>;
  if (list && (list.groupId ?? list.eventId) !== groupId)
    return <p role='alert'>List unavailable in this context.</p>;
  return (
    <ListEditor key={list?.version ?? 'new'} groupId={groupId} list={list} />
  );
}
function ListEditor({
  groupId,
  list,
}: {
  groupId: ContentOwnerId;
  list: ReturnType<typeof hooks.useListManagement>;
}) {
  const base = useContentBase(groupId);
  const create = hooks.useCreateList();
  const configure = hooks.useConfigureList();
  const remove = hooks.useDeleteList();
  const router = useRouter();
  const [title, setTitle] = useState(list?.title ?? 'New list');
  const [description, setDescription] = useState(list?.description ?? '');
  const [visibility, setVisibility] = useState<'MANAGERS' | 'MEMBERS'>(
    list?.resultsVisibility ?? 'MEMBERS'
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <main className='mx-auto w-full max-w-md px-4 py-4'>
      <h1 className='sr-only'>{list ? 'Manage list' : 'Create list'}</h1>
      <form
        className={listCard}
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
              router.push(`${base}/lists`);
            } else {
              const id = await create({
                groupId,
                title,
                description,
                resultsVisibility: visibility,
              });
              router.push(`${base}/lists/${id}`);
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
        <Label className='sr-only' htmlFor='community-list-title'>
          List title
        </Label>
        <Textarea
          rows={1}
          className={titleField}
          id='community-list-title'
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          maxLength={100}
          disabled={busy}
        />
        <Label className='sr-only' htmlFor='community-list-description'>
          List description
        </Label>
        <Textarea
          rows={1}
          placeholder='Add a description…'
          className={descriptionField}
          id='community-list-description'
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={2000}
          disabled={busy}
        />

        {!list && (
          <>
            <Label className='sr-only' htmlFor='community-list-visibility'>
              Entry visibility (fixed)
            </Label>
            <select
              className='w-full min-w-0 rounded-input border border-input bg-background p-2 text-sm'
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

        <Button disabled={busy}>
          {list ? 'Save list settings' : 'Create list'}
        </Button>
        <Button
          variant='ghost'
          type='button'
          disabled={busy}
          onClick={() => router.push(`${base}/lists`)}
        >
          Cancel
        </Button>
      </form>
      {list && (
        <details className='mt-2 text-sm'>
          <summary className='cursor-pointer p-2 text-muted-foreground'>
            More
          </summary>
          <GroupConfirmedAction
            label='Delete list'
            confirmation='Confirm deleting list and all entries'
            explanation='All list configuration, entries and retry records are permanently removed.'
            onConfirm={async () => {
              await remove({ toolId: list._id });
              router.push(`${base}/lists`);
            }}
          />
        </details>
      )}
      {error && (
        <p
          role='alert'
          className='rounded-input border-l-4 border-border-error bg-bg-error-subtle p-3 text-sm text-error'
        >
          {error}
        </p>
      )}
    </main>
  );
}
export function GroupListInteraction({
  groupId,
  toolId,
}: {
  groupId: ContentOwnerId;
  toolId: Id<'groupTools'>;
}) {
  const group = useGroup(groupId);
  const policy = hooks.useListPolicy({ groupId });
  const eligible =
    group && group.joiningQuestionnaire?.canAccessMemberContent !== false;
  const list = hooks.useList(eligible && policy?.enabled ? { toolId } : 'skip');
  return (
    <main className={listCard}>
      {!eligible || (policy && !policy.enabled) ? (
        <p role='alert'>
          Complete required onboarding and use enabled lists to contribute. Own
          saved entries remain available.
        </p>
      ) : !list ? (
        <p role='status'>Loading list…</p>
      ) : (list.groupId ?? list.eventId) !== groupId ? (
        <p role='alert'>List unavailable in this context.</p>
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
  groupId: ContentOwnerId;
  list: NonNullable<ReturnType<typeof hooks.useList>>;
}) {
  const base = useContentBase(groupId);
  const add = hooks.useAddListEntry();
  const [text, setText] = useState('');
  const [attempt, setAttempt] = useState<Parameters<typeof add>[0] | null>(
    null
  );
  const [busy, setBusy] = useState(false);
  const addPending = useRef(false);
  const [message, setMessage] = useState('');
  return (
    <section className='min-w-0 space-y-3'>
      <header className='flex items-start justify-between gap-2'>
        <h1 className='min-w-0 break-words font-heading text-base font-semibold leading-snug'>
          {list.title}
        </h1>
        {list.canManage && (
          <Button
            asChild
            variant='ghost'
            size='icon'
            className='size-10 shrink-0'
          >
            <Link
              href={`${base}/lists/${list._id}/settings`}
              aria-label='Manage list settings'
            >
              <Settings className='size-4' aria-hidden='true' />
            </Link>
          </Button>
        )}
      </header>
      {list.description && (
        <p className='whitespace-pre-wrap break-words text-sm leading-relaxed'>
          {list.description}
        </p>
      )}
      <GroupListEntries toolId={list._id} version={list.version} />
      <form
        className='flex min-w-0 items-start gap-2'
        onSubmit={async e => {
          e.preventDefault();
          if (addPending.current) return;
          addPending.current = true;
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
                ? ''
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
            addPending.current = false;
            setBusy(false);
          }
        }}
      >
        <Label className='sr-only' htmlFor='community-list-entry'>
          New entry
        </Label>
        <Textarea
          rows={1}
          placeholder='Add an entry…'
          className='min-h-10 min-w-0 flex-1 resize-y field-sizing-content'
          id='community-list-entry'
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={2000}
          required
          disabled={busy || Boolean(attempt)}
        />
        <Button
          disabled={busy}
          size={attempt ? 'default' : 'icon'}
          className='shrink-0'
          aria-label={attempt ? 'Retry original entry' : 'Add entry'}
        >
          {attempt ? 'Retry' : <Plus className='size-4' aria-hidden='true' />}
        </Button>
      </form>

      {attempt && !busy && (
        <>
          <p>
            {attempt.version !== list.version
              ? 'List settings changed since the original attempt. Inspect the current list before starting another request.'
              : 'Retry keeps the original contribution. Inspect saved entries before starting another request.'}
          </p>
          <GroupConfirmedAction
            key={attempt.requestId}
            label='Start new request after inspection'
            confirmation='Confirm starting a new entry request'
            explanation='Inspect saved entries and the current list settings first. A previous request may have succeeded; using a new request can create a duplicate. Your draft will be retained.'
            onConfirm={async () => {
              setText(attempt.text);
              setAttempt(null);
              setMessage(
                'Draft retained. Inspect the current list before submitting a new request.'
              );
            }}
          />
        </>
      )}
      {message && (
        <p role='status' className='text-xs text-muted-foreground'>
          {message}
        </p>
      )}
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
    <section
      className='min-w-0 divide-y divide-border'
      aria-label='List entries'
    >
      {entries === undefined ? (
        <p role='status'>Loading entries…</p>
      ) : entries.page.length === 0 ? (
        <p className='py-2 text-sm text-muted-foreground'>
          No entries on this page.
        </p>
      ) : null}
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
  const [saved, setSaved] = useState({
    text: entry.text,
    completed: entry.completed,
    revision: entry.revision,
  });
  const [text, setText] = useState(entry.text);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState<{
    text: string;
    completed: boolean;
  } | null>(null);
  const pending = useRef(false);
  const accepted = useRef(saved);
  async function persist(next: { text: string; completed: boolean }) {
    if (pending.current) return;
    if (
      next.text === accepted.current.text &&
      next.completed === accepted.current.completed
    ) {
      setEditing(false);
      return;
    }
    pending.current = true;
    setBusy(true);
    setError('');
    setRetry(null);
    try {
      const result = await edit({
        entryId: entry._id,
        version,
        expectedRevision: accepted.current.revision,
        ...next,
      });
      const confirmed = { ...next, revision: result.revision };
      accepted.current = confirmed;
      setSaved(confirmed);
      setText(confirmed.text);
      setEditing(false);
    } catch (error) {
      setError(failure(error));
      setRetry(next);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <article className='min-w-0 py-1' aria-busy={busy || undefined}>
      <div className='flex min-w-0 items-start gap-1'>
        <label className='flex min-h-11 min-w-0 flex-1 items-start gap-3 py-3 text-sm leading-relaxed'>
          <input
            className='mt-1 size-4 shrink-0 accent-primary'
            type='checkbox'
            aria-label={`Completed: ${saved.text}`}
            checked={saved.completed}
            disabled={!entry.canEdit || busy}
            onChange={e => {
              void persist({ text: saved.text, completed: e.target.checked });
            }}
          />
          {!editing && (
            <span
              className={
                saved.completed
                  ? 'min-w-0 break-words text-muted-foreground line-through'
                  : 'min-w-0 break-words'
              }
            >
              {saved.text}
            </span>
          )}
        </label>
        {entry.canEdit && !editing && (
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='size-11 shrink-0'
            disabled={busy}
            aria-label={`Edit entry: ${saved.text}`}
            onClick={() => {
              setText(saved.text);
              setEditing(true);
              setError('');
              setRetry(null);
            }}
          >
            <Pencil className='size-4' aria-hidden='true' />
          </Button>
        )}
        {entry.canRemove && (
          <details className='relative shrink-0 text-sm'>
            <summary
              className='flex min-h-11 cursor-pointer list-none items-center justify-center rounded-input px-3 focus-visible:outline-2 focus-visible:outline-ring'
              aria-label={`Entry actions: ${saved.text}`}
            >
              <MoreHorizontal className='size-4' aria-hidden='true' />
            </summary>
            <div className='absolute right-0 z-popover w-56 rounded-input border border-border bg-card p-2 shadow-floating'>
              <GroupConfirmedAction
                label='Remove entry'
                confirmation='Confirm removing this entry'
                explanation='Remove this entry?'
                onConfirm={() =>
                  remove({
                    entryId: entry._id,
                    expectedRevision: accepted.current.revision,
                  })
                }
              />
            </div>
          </details>
        )}
      </div>
      {editing && (
        <div className='pb-2'>
          <Label htmlFor={`entry-${entry._id}`} className='sr-only'>
            Entry text
          </Label>
          <Textarea
            id={`entry-${entry._id}`}
            autoFocus
            rows={1}
            className='min-h-10 text-sm field-sizing-content'
            value={text}
            onChange={e => setText(e.target.value)}
            required
            maxLength={2000}
            disabled={busy}
            onBlur={e => {
              if (e.currentTarget.validity.valid)
                void persist({ text, completed: saved.completed });
            }}
            onKeyDown={e => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === 'Escape') {
                e.preventDefault();
                setText(saved.text);
                setEditing(false);
                setError('');
                setRetry(null);
              } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (e.currentTarget.reportValidity())
                  void persist({ text, completed: saved.completed });
              }
            }}
            aria-describedby={`entry-help-${entry._id}`}
          />
          <span id={`entry-help-${entry._id}`} className='sr-only'>
            Press Enter or leave this field to update. Press Escape to cancel.
          </span>
        </div>
      )}
      {busy && (
        <span role='status' className='text-xs text-muted-foreground'>
          Updating…
        </span>
      )}
      {error && (
        <div className='flex flex-wrap items-center gap-2 pb-2'>
          <p role='alert' className='text-xs text-error'>
            {error}
          </p>
          {retry && (
            <Button
              type='button'
              size='sm'
              variant='ghost'
              onClick={() => {
                void persist(retry);
              }}
            >
              Retry update
            </Button>
          )}
        </div>
      )}
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
    <ContentPage>
      <h1 className='font-heading'>My saved list entries</h1>
      <p>
        Your own retained contributions and their original list title. Current
        private list settings are not loaded.
      </p>
      {entries === undefined ? (
        <p role='status'>Loading entries…</p>
      ) : entries.page.length === 0 ? (
        <p className='rounded-input border border-dashed border-border p-6 text-sm text-muted-foreground'>
          No entries on this page.
        </p>
      ) : null}
      {entries?.page.map(entry => (
        <article
          key={entry._id}
          className='rounded-card border border-border p-4'
        >
          <h2 className='font-heading'>{entry.listTitle}</h2>
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
    </ContentPage>
  );
}
