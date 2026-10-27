'use client';
import { Minus, MoreHorizontal, Pencil, Plus, Settings } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
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
  initialType,
}: {
  groupId: ContentOwnerId;
  toolId?: Id<'groupTools'>;
  initialType?: ListType;
}) {
  const group = useGroup(groupId);
  const policy = hooks.useListPolicy({ groupId });
  const manager =
    group?.viewerRole === 'OWNER' || group?.viewerRole === 'MODERATOR';
  const eligible =
    group && group.joiningQuestionnaire?.canAccessMemberContent !== false;
  const list = hooks.useListManagement(
    toolId && eligible ? { toolId } : 'skip'
  );
  if (group === undefined || policy === undefined)
    return <p role='status'>Loading list settings…</p>;
  if (
    !eligible ||
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
  if (list && !list.canConfigure && !list.canManage)
    return (
      <p role='alert'>
        Only the creator and current managers can edit this list.
      </p>
    );
  return (
    <ListEditor
      key={list?.version ?? `new:${initialType ?? 'CHECKLIST'}`}
      groupId={groupId}
      list={list}
      initialType={initialType}
    />
  );
}
type ListType = 'SIMPLE' | 'CHECKLIST' | 'BRING';
type AddPolicy = 'PARTICIPANTS' | 'CREATOR_MANAGERS';
type CompletionPolicy = 'PARTICIPANTS' | 'AUTHORS' | 'CREATOR_MANAGERS';
const typeNames = {
  SIMPLE: 'Simple list',
  CHECKLIST: 'Checklist',
  BRING: 'Bring list',
};
const selectClass =
  'w-full min-w-0 rounded-input border border-input bg-background p-2 text-sm';
function ListEditor({
  groupId,
  list,
  initialType,
}: {
  groupId: ContentOwnerId;
  list: ReturnType<typeof hooks.useListManagement>;
  initialType?: ListType;
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
  const [listType, setListType] = useState<ListType>(
    list?.listType ?? initialType ?? 'CHECKLIST'
  );
  const [addPolicy, setAddPolicy] = useState<AddPolicy>(
    list?.addPolicy ??
      (initialType === 'BRING' ? 'CREATOR_MANAGERS' : 'PARTICIPANTS')
  );
  const [completionPolicy, setCompletionPolicy] = useState<CompletionPolicy>(
    list?.completionPolicy ?? 'PARTICIPANTS'
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsAnchor = useRef<HTMLDivElement>(null);
  const [settingsKey, setSettingsKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState('');
  return (
    <main className='mx-auto w-full max-w-md px-4 py-4'>
      <h1 className='sr-only'>{list ? 'Manage list' : 'Create list'}</h1>
      <form
        className={listCard}
        onSubmit={async e => {
          e.preventDefault();
          if (pending.current) return;
          pending.current = true;
          setBusy(true);
          setError('');
          try {
            const settings = { listType, addPolicy, completionPolicy };
            if (list) {
              await configure({
                toolId: list._id,
                version: list.version,
                title,
                description,
                ...settings,
              });
              router.push(`${base}/lists`);
            } else {
              const id = await create({
                groupId,
                title,
                description,
                resultsVisibility: visibility,
                ...settings,
              });
              router.push(`${base}/lists/${id}`);
            }
          } catch (e) {
            setError(
              failure(e) +
                ' Inspect the list before repeating an uncertain creation.'
            );
          } finally {
            pending.current = false;
            setBusy(false);
          }
        }}
      >
        <div ref={settingsAnchor} className='flex min-w-0 items-start gap-2'>
          <Label className='sr-only' htmlFor='community-list-title'>
            List title
          </Label>
          <Textarea
            rows={1}
            className={`${titleField} min-w-0 flex-1`}
            id='community-list-title'
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            maxLength={100}
            disabled={busy}
          />
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='size-10 shrink-0'
            aria-label='List settings'
            disabled={busy}
            onClick={() => {
              setSettingsKey(key => key + 1);
              setSettingsOpen(true);
            }}
          >
            <Settings className='size-4' aria-hidden='true' />
          </Button>
        </div>
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
        <div className='flex flex-wrap gap-2'>
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
        </div>
      </form>
      <ListSettings
        key={settingsKey}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onClosed={() =>
          settingsAnchor.current?.querySelector('button')?.focus()
        }
        value={{ listType, addPolicy, completionPolicy, visibility }}
        initialType={list?.listType ?? 'CHECKLIST'}
        hasEntries={Boolean(list?.hasEntries)}
        existing={Boolean(list)}
        base={base}
        onApply={value => {
          setListType(value.listType);
          setAddPolicy(value.addPolicy);
          setCompletionPolicy(value.completionPolicy);
          setVisibility(value.visibility);
          setSettingsOpen(false);
        }}
      />
      {list && (list.canDelete ?? list.canManage) && (
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
        <p role='alert' className='mt-2 text-sm text-error'>
          {error}
        </p>
      )}
    </main>
  );
}
function ListSettings({
  open,
  onOpenChange,
  onClosed,
  value,
  onApply,
  initialType,
  hasEntries,
  existing,
  base,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClosed: () => void;
  value: {
    listType: ListType;
    addPolicy: AddPolicy;
    completionPolicy: CompletionPolicy;
    visibility: 'MANAGERS' | 'MEMBERS';
  };
  onApply: (value: {
    listType: ListType;
    addPolicy: AddPolicy;
    completionPolicy: CompletionPolicy;
    visibility: 'MANAGERS' | 'MEMBERS';
  }) => void;
  initialType: ListType;
  hasEntries: boolean;
  existing: boolean;
  base: string;
}) {
  const [draft, setDraft] = useState(value);
  const bringBoundary =
    hasEntries && (initialType === 'BRING') !== (draft.listType === 'BRING');
  const personalBring =
    draft.listType === 'BRING' && draft.visibility === 'MANAGERS';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onCloseAutoFocus={event => {
          event.preventDefault();
          onClosed();
        }}
        className='max-h-[80dvh] min-w-0 overflow-y-auto'
        aria-describedby={undefined}
      >
        <DialogTitle>List settings</DialogTitle>
        <div className='space-y-4'>
          <div className='space-y-1'>
            <Label htmlFor='list-type'>Type</Label>
            <select
              id='list-type'
              className={selectClass}
              value={draft.listType}
              onChange={e =>
                setDraft(current => ({
                  ...current,
                  listType: e.target.value as ListType,
                  addPolicy:
                    !existing && e.target.value === 'BRING'
                      ? 'CREATOR_MANAGERS'
                      : current.addPolicy,
                }))
              }
            >
              {Object.entries(typeNames).map(([value, label]) => (
                <option
                  key={value}
                  value={value}
                  disabled={
                    value === 'BRING' && draft.visibility === 'MANAGERS'
                  }
                >
                  {label}
                </option>
              ))}
            </select>
          </div>
          {draft.visibility === 'MANAGERS' && (
            <p className='text-xs text-muted-foreground'>
              Bring lists require shared visibility.
            </p>
          )}
          {!existing && (
            <div className='space-y-1'>
              <Label htmlFor='community-list-visibility'>
                Entry visibility (fixed)
              </Label>
              <select
                id='community-list-visibility'
                className={selectClass}
                value={draft.visibility}
                onChange={e =>
                  setDraft(current => ({
                    ...current,
                    visibility:
                      e.target.value === 'MANAGERS' ? 'MANAGERS' : 'MEMBERS',
                  }))
                }
              >
                <option value='MEMBERS'>Shared with eligible members</option>
                <option value='MANAGERS' disabled={draft.listType === 'BRING'}>
                  Personal to authors and managers
                </option>
              </select>
            </div>
          )}
          <div className='space-y-1'>
            <Label htmlFor='list-add-policy'>Who can add items?</Label>
            <select
              id='list-add-policy'
              className={selectClass}
              value={draft.addPolicy}
              onChange={e =>
                setDraft(current => ({
                  ...current,
                  addPolicy: e.target.value as AddPolicy,
                }))
              }
            >
              <option value='PARTICIPANTS'>Participants</option>
              <option value='CREATOR_MANAGERS'>Creator and managers</option>
            </select>
          </div>
          {draft.listType === 'CHECKLIST' && draft.visibility === 'MEMBERS' && (
            <div className='space-y-1'>
              <Label htmlFor='list-completion-policy'>
                Who can check off items?
              </Label>
              <select
                id='list-completion-policy'
                className={selectClass}
                value={draft.completionPolicy}
                onChange={e =>
                  setDraft(current => ({
                    ...current,
                    completionPolicy: e.target.value as CompletionPolicy,
                  }))
                }
              >
                <option value='PARTICIPANTS'>Participants</option>
                <option value='AUTHORS'>Item authors and managers</option>
                <option value='CREATOR_MANAGERS'>Creator and managers</option>
              </select>
            </div>
          )}
          {draft.listType === 'CHECKLIST' &&
            draft.visibility === 'MANAGERS' && (
              <p className='text-xs text-muted-foreground'>
                Only item authors and managers can check off personal entries.
              </p>
            )}
          {personalBring && (
            <p role='alert' className='text-sm text-error'>
              Bring lists require shared visibility. Create a separate shared
              Bring list.
            </p>
          )}
          {bringBoundary && (
            <div className='space-y-2'>
              <p role='alert' className='text-sm text-muted-foreground'>
                This change needs a separate list. Your entries, quantities and
                claims will stay here.
              </p>
              <Button asChild variant='outline'>
                <Link href={`${base}/lists/new?type=${draft.listType}`}>
                  Create separate {typeNames[draft.listType]}
                </Link>
              </Button>
            </div>
          )}
        </div>
        <div className='flex flex-wrap justify-end gap-2'>
          <Button
            type='button'
            variant='ghost'
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type='button'
            disabled={bringBoundary || personalBring}
            onClick={() => onApply(draft)}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
  const [quantity, setQuantity] = useState(1);
  const listType = list.listType ?? 'CHECKLIST';
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
        {(list.canConfigure ?? list.canManage) && (
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
      <GroupListEntries
        toolId={list._id}
        version={list.version}
        listType={listType}
      />
      {(list.canAdd ?? true) && (
        <form
          className='flex min-w-0 flex-wrap items-start gap-2'
          onSubmit={async e => {
            e.preventDefault();
            if (addPending.current) return;
            addPending.current = true;
            const input = attempt ?? {
              toolId: list._id,
              version: list.version,
              requestId: listEntryRequestId(),
              text,
              ...(listType === 'BRING' ? { quantity } : {}),
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
          {listType === 'BRING' && (
            <>
              <Label className='sr-only' htmlFor='list-item-quantity'>
                Quantity needed
              </Label>
              <Input
                className='w-20 shrink-0'
                id='list-item-quantity'
                type='number'
                min={1}
                max={999}
                step={1}
                value={quantity}
                disabled={busy || Boolean(attempt)}
                onChange={e => setQuantity(Number(e.target.value))}
                required
              />
            </>
          )}
          <Button
            disabled={busy}
            size={attempt ? 'default' : 'icon'}
            className='shrink-0'
            aria-label={attempt ? 'Retry original entry' : 'Add entry'}
          >
            {attempt ? 'Retry' : <Plus className='size-4' aria-hidden='true' />}
          </Button>
        </form>
      )}

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
  listType,
}: {
  toolId: Id<'groupTools'>;
  version: number;
  listType: ListType;
}) {
  const [cursor, setCursor] = useState<string | null>(null);
  const entries = hooks.useListEntries({
    toolId,
    paginationOpts: { numItems: 20, cursor },
  });
  const claims = hooks.useBringListClaims(
    listType === 'BRING' && entries
      ? { toolId, entryIds: entries.page.map(entry => entry._id) }
      : 'skip'
  );
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
        <div key={entry._id} className='min-w-0'>
          <EntryEditor
            key={`${entry._id}:${entry.revision}:${version}`}
            entry={entry}
            listType={listType}
            version={version}
          />
          {listType === 'BRING' && (
            <>
              <BringClaimControls
                toolId={toolId}
                entry={entry}
                version={version}
                claim={claims?.find(claim => claim.entryId === entry._id)}
              />
              {entry.addedByName && (
                <p className='break-words pb-2 text-xs leading-relaxed text-muted-foreground'>
                  Added by {entry.addedByName}
                </p>
              )}
            </>
          )}
        </div>
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
  listType,
}: {
  entry: NonNullable<ReturnType<typeof hooks.useListEntries>>['page'][number];
  version: number;
  listType: ListType;
}) {
  const edit = hooks.useEditListEntry();
  const complete = hooks.useSetListEntryCompleted();
  const remove = hooks.useRemoveListEntry();
  const [saved, setSaved] = useState({
    text: entry.text,
    completed: entry.completed,
    revision: entry.revision,
    quantity: entry.quantity,
  });
  const [text, setText] = useState(entry.text);
  const [quantity, setQuantity] = useState(entry.quantity ?? 1);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState<
    | { kind: 'text'; text: string; quantity?: number }
    | { kind: 'complete'; completed: boolean }
    | null
  >(null);
  const pending = useRef(false);
  const accepted = useRef(saved);
  async function persist(
    next:
      | { kind: 'text'; text: string; quantity?: number }
      | { kind: 'complete'; completed: boolean }
  ) {
    if (pending.current) return;
    if (
      next.kind === 'text' &&
      next.text === accepted.current.text &&
      (listType !== 'BRING' || next.quantity === accepted.current.quantity)
    ) {
      setEditing(false);
      return;
    }
    if (
      next.kind === 'complete' &&
      next.completed === accepted.current.completed
    )
      return;
    if (next.kind === 'text' && !next.text.trim()) {
      setError('Enter text for this entry.');
      return;
    }
    if (
      next.kind === 'text' &&
      listType === 'BRING' &&
      (!Number.isInteger(next.quantity) ||
        !next.quantity ||
        next.quantity < 1 ||
        next.quantity > 999)
    ) {
      setError('Enter a quantity from 1 to 999.');
      return;
    }
    pending.current = true;
    setBusy(true);
    setError('');
    setRetry(null);
    try {
      const result =
        next.kind === 'complete'
          ? await complete({
              entryId: entry._id,
              version,
              expectedRevision: accepted.current.revision,
              completed: next.completed,
            })
          : await edit({
              entryId: entry._id,
              version,
              expectedRevision: accepted.current.revision,
              text: next.text,
              completed: accepted.current.completed,
              ...(listType === 'BRING' ? { quantity: next.quantity } : {}),
            });
      const confirmed = {
        text: next.kind === 'text' ? next.text : accepted.current.text,
        completed:
          next.kind === 'complete'
            ? next.completed
            : accepted.current.completed,
        revision: result.revision,
        quantity:
          next.kind === 'text' && listType === 'BRING'
            ? next.quantity
            : accepted.current.quantity,
      };
      accepted.current = confirmed;
      setSaved(confirmed);
      setText(confirmed.text);
      setQuantity(confirmed.quantity ?? 1);
      setEditing(false);
    } catch (error) {
      setError(failure(error));
      setRetry(next);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  const ItemContent = listType === 'CHECKLIST' ? 'label' : 'div';
  return (
    <article className='min-w-0 py-1' aria-busy={busy || undefined}>
      <div className='flex min-w-0 items-start gap-1'>
        <div className='min-w-0 flex-1'>
          <ItemContent className='flex min-h-11 min-w-0 items-start gap-3 py-3 text-sm leading-relaxed'>
            {listType === 'CHECKLIST' && (
              <input
                className='mt-1 size-4 shrink-0 accent-primary'
                type='checkbox'
                aria-label={`Completed: ${saved.text}`}
                checked={saved.completed}
                disabled={!(entry.canComplete ?? entry.canEdit) || busy}
                onChange={e =>
                  void persist({
                    kind: 'complete',
                    completed: e.target.checked,
                  })
                }
              />
            )}
            {!editing && (
              <span
                className={
                  listType === 'CHECKLIST' && saved.completed
                    ? 'min-w-0 break-words text-muted-foreground line-through'
                    : 'min-w-0 break-words'
                }
              >
                {saved.text}
              </span>
            )}
          </ItemContent>
        </div>
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
              setQuantity(saved.quantity ?? 1);
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
                explanation={
                  listType === 'BRING'
                    ? 'Remove this item and its claims?'
                    : 'Remove this entry?'
                }
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
        <div
          className='space-y-2 pb-2'
          onBlur={event => {
            if (
              !event.currentTarget.contains(event.relatedTarget as Node | null)
            )
              void persist({
                kind: 'text',
                text,
                ...(listType === 'BRING' ? { quantity } : {}),
              });
          }}
        >
          <Label htmlFor={`entry-${entry._id}`} className='sr-only'>
            Entry text
          </Label>
          <Textarea
            id={`entry-${entry._id}`}
            autoFocus
            rows={1}
            className='min-h-10 text-sm field-sizing-content'
            value={text}
            onChange={event => setText(event.target.value)}
            required
            maxLength={2000}
            disabled={busy}
            onKeyDown={event => {
              if (event.nativeEvent.isComposing) return;
              if (event.key === 'Escape') {
                event.preventDefault();
                setText(saved.text);
                setQuantity(saved.quantity ?? 1);
                setEditing(false);
                setError('');
                setRetry(null);
              } else if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                if (event.currentTarget.reportValidity())
                  void persist({
                    kind: 'text',
                    text,
                    ...(listType === 'BRING' ? { quantity } : {}),
                  });
              }
            }}
            aria-describedby={`entry-help-${entry._id}`}
          />
          {listType === 'BRING' && (
            <div className='flex items-center gap-3'>
              <Label htmlFor={`quantity-${entry._id}`} className='text-sm'>
                Quantity needed
              </Label>
              <Input
                id={`quantity-${entry._id}`}
                className='w-24'
                type='number'
                min={Math.max(1, entry.claimedQuantity ?? 0)}
                max={999}
                step={1}
                value={quantity}
                required
                disabled={busy}
                onChange={event => setQuantity(Number(event.target.value))}
                onKeyDown={event => {
                  if (event.nativeEvent.isComposing) return;
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    setText(saved.text);
                    setQuantity(saved.quantity ?? 1);
                    setEditing(false);
                    setError('');
                    setRetry(null);
                  } else if (event.key === 'Enter') {
                    event.preventDefault();
                    if (event.currentTarget.reportValidity())
                      void persist({ kind: 'text', text, quantity });
                  }
                }}
              />
            </div>
          )}
          <span id={`entry-help-${entry._id}`} className='sr-only'>
            Press Enter or leave these fields to update. Press Escape to cancel.
          </span>
        </div>
      )}
      {((listType !== 'BRING' && entry.addedByName) ||
        (listType === 'CHECKLIST' &&
          saved.completed &&
          saved.revision === entry.revision &&
          entry.completedByName)) && (
        <p className='pb-2 text-xs leading-relaxed text-muted-foreground break-words'>
          {entry.addedByName && `Added by ${entry.addedByName}`}
          {entry.addedByName &&
            listType === 'CHECKLIST' &&
            saved.completed &&
            saved.revision === entry.revision &&
            entry.completedByName &&
            ' · '}
          {listType === 'CHECKLIST' &&
            saved.completed &&
            saved.revision === entry.revision &&
            entry.completedByName &&
            `Completed by ${entry.completedByName}`}
        </p>
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
              onClick={() => void persist(retry)}
            >
              Retry update
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
function BringClaimControls({
  toolId,
  entry,
  version,
  claim,
}: {
  toolId: Id<'groupTools'>;
  entry: NonNullable<ReturnType<typeof hooks.useListEntries>>['page'][number];
  version: number;
  claim:
    | NonNullable<ReturnType<typeof hooks.useBringListClaims>>[number]
    | undefined;
}) {
  const setClaim = hooks.useSetBringListClaim();
  const [acknowledged, setAcknowledged] = useState<{
    quantity: number;
    revision: number;
    total: number;
  } | null>(null);
  const authoritative = {
    quantity: claim?.myQuantity ?? 0,
    revision: claim?.myRevision ?? 0,
    total: claim?.totalClaimed ?? entry.claimedQuantity ?? 0,
  };
  // Remote totals can change without changing this member's claim revision.
  // Once the subscription has caught up, it owns the latest shared total.
  const saved =
    !acknowledged || authoritative.revision >= acknowledged.revision
      ? authoritative
      : acknowledged;
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function change(quantity: number) {
    if (pending.current || !claim) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await setClaim({
        toolId,
        entryId: entry._id,
        version,
        expectedClaimRevision: saved.revision,
        quantity,
      });
      const confirmed = {
        quantity: result.quantity,
        revision: result.revision,
        total: result.totalClaimed,
      };
      setAcknowledged(confirmed);
    } catch (e) {
      setError(failure(e));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  const needed = entry.quantity ?? 1;
  return (
    <div className='space-y-1 pb-2'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <span className='text-xs text-muted-foreground'>
          {saved.total} / {needed} claimed
        </span>
        <div
          className='flex items-center gap-1'
          aria-label={`Your claim for ${entry.text}`}
        >
          <Button
            type='button'
            size='icon'
            variant='ghost'
            className='size-10'
            disabled={busy || !claim || saved.quantity === 0}
            aria-label={`Claim fewer ${entry.text}`}
            onClick={() => void change(saved.quantity - 1)}
          >
            <Minus className='size-4' aria-hidden='true' />
          </Button>
          <span
            className='min-w-6 text-center text-sm tabular-nums'
            aria-live='polite'
          >
            {saved.quantity}
          </span>
          <Button
            type='button'
            size='icon'
            variant='ghost'
            className='size-10'
            disabled={busy || !claim || saved.total >= needed}
            aria-label={`Claim more ${entry.text}`}
            onClick={() => void change(saved.quantity + 1)}
          >
            <Plus className='size-4' aria-hidden='true' />
          </Button>
        </div>
      </div>
      {claim && claim.claimants.length > 0 && (
        <p className='break-words text-xs leading-relaxed text-muted-foreground'>
          {claim.claimants
            .map(person => `${person.name} (${person.quantity})`)
            .join(', ')}
          {claim.hasMoreClaimants && ', and others'}
        </p>
      )}
      {busy && (
        <span role='status' className='text-xs text-muted-foreground'>
          Updating claim…
        </span>
      )}
      {error && (
        <p role='alert' className='text-xs text-error'>
          {error}
        </p>
      )}
    </div>
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
