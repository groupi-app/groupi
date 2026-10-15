'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useInviteListNavigationGuard } from '@/hooks/use-invite-list-navigation-guard';
import { QuerySection } from '@/components/molecules/query-section';
import { ConvexError } from 'convex/values';
import { SettingsPageTemplate } from '@/components/templates/settings-page-template';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  InviteListPersonRow,
  InviteListPersonChoices,
  InviteListSelectedPeople,
} from '@/components/organisms/invite-list-people';
import {
  useInviteLists,
  useInviteList,
  useCreateInviteList,
  useUpdateInviteList,
  useDeleteInviteList,
} from '@/hooks/convex/use-invite-lists';

type Detail = NonNullable<ReturnType<typeof useInviteList>>;
type Person = Detail['people'][number];
type ListId = NonNullable<
  ReturnType<typeof useInviteLists>
>['items'][number]['inviteListId'];

function ListCollection({
  createRef,
  startCreate,
  inspect,
  focusListId,
}: {
  createRef: React.RefObject<HTMLDivElement | null>;
  startCreate: () => void;
  inspect: (id: ListId) => void;
  focusListId?: ListId;
}) {
  const lists = useInviteLists();
  if (!lists) return <p role='status'>Loading invite lists…</p>;
  return (
    <>
      {!lists.items.length && (
        <div className='rounded-card border border-dashed border-border bg-muted p-6'>
          <h2 className='font-heading text-lg'>No invite lists yet</h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            Save people you often invite together, then choose your list when
            inviting people to an event.
          </p>
        </div>
      )}
      {lists.items.map(list => (
        <Button
          key={list.inviteListId}
          variant='outline'
          className='h-auto w-full justify-between gap-3 py-4 text-left'
          autoFocus={focusListId === list.inviteListId}
          aria-label={`View ${list.name}, ${list.personCount} ${list.personCount === 1 ? 'person' : 'people'}`}
          onClick={() => inspect(list.inviteListId)}
        >
          <span className='min-w-0 flex-1 whitespace-normal break-words'>
            {list.name}
          </span>
          <span className='flex shrink-0 flex-col items-end gap-1 text-sm'>
            {list.personCount} {list.personCount === 1 ? 'person' : 'people'}
            {list.needsAttention && (
              <Badge variant='warning'>Needs attention</Badge>
            )}
          </span>
        </Button>
      ))}
      {lists.items.length >= 100 && (
        <p role='status'>You have reached the limit of 100 invite lists.</p>
      )}
      <div ref={createRef}>
        <Button disabled={lists.items.length >= 100} onClick={startCreate}>
          Create invite list
        </Button>
      </div>
    </>
  );
}

function ListDetail({
  id,
  edit,
  remove,
  focusEdit,
  focusDelete,
}: {
  id: ListId;
  edit: (list: Detail) => void;
  remove: (list: Detail) => void;
  focusEdit: boolean;
  focusDelete: boolean;
}) {
  const list = useInviteList(id);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!focusEdit && !focusDelete) headingRef.current?.focus();
  }, [list?.inviteListId, focusEdit, focusDelete]);
  if (!list) return <p role='status'>Loading invite list…</p>;
  return (
    <section className='flex flex-col gap-3'>
      <h2
        tabIndex={-1}
        ref={headingRef}
        className='break-words text-xl font-heading'
      >
        {list.name}
      </h2>
      {list.needsAttention && (
        <Alert variant='warning' role='status'>
          <AlertDescription>
            Needs attention. Add an existing person before using this list.
          </AlertDescription>
        </Alert>
      )}
      <p className='text-muted-foreground'>
        {list.personCount} {list.personCount === 1 ? 'person' : 'people'}
      </p>
      {list.people.map((person, index) => (
        <InviteListPersonRow key={index} person={person} />
      ))}
      <div className='flex flex-wrap gap-2'>
        <Button onClick={() => edit(list)} autoFocus={focusEdit}>
          Edit list
        </Button>
        <Button
          variant='destructive'
          onClick={() => remove(list)}
          autoFocus={focusDelete}
        >
          Delete list
        </Button>
      </div>
    </section>
  );
}

export function InviteListsSettings() {
  const create = useCreateInviteList();
  const update = useUpdateInviteList();
  const remove = useDeleteInviteList();
  const [view, setView] = useState<
    'collection' | 'create' | 'edit' | 'detail' | 'delete'
  >('collection');
  const [detailId, setDetailId] = useState<ListId>();
  const [focusListId, setFocusListId] = useState<ListId>();
  const [focusEdit, setFocusEdit] = useState(false);
  const [focusDelete, setFocusDelete] = useState(false);
  const [deleteName, setDeleteName] = useState('');
  const [deleted, setDeleted] = useState(false);
  const deleteHeading = useRef<HTMLHeadingElement>(null);
  const [initialDraft, setInitialDraft] = useState<{
    name: string;
    personIds: Person['personId'][];
  }>({ name: '', personIds: [] });
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Person[]>([]);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const nameRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLDivElement>(null);
  const confirmationRef = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const editorRef = useRef<HTMLFieldSetElement>(null);
  const lastEditorFocus = useRef<HTMLElement | null>(null);
  const pendingLeave = useRef<(() => void) | undefined>(undefined);
  const wasConfirming = useRef(false);
  const editing = view === 'create' || view === 'edit';
  const dirty =
    editing &&
    (name !== initialDraft.name ||
      selected.length !== initialDraft.personIds.length ||
      selected.some(
        person => !initialDraft.personIds.includes(person.personId)
      ));
  useEffect(() => {
    if (view === 'create' || view === 'edit')
      nameRef.current?.querySelector('input')?.focus();
  }, [view]);
  useEffect(() => {
    if (view === 'delete') deleteHeading.current?.focus();
  }, [view]);
  useLayoutEffect(() => {
    if (confirming) {
      const heading = confirmationRef.current;
      heading?.focus();
      wasConfirming.current = true;
      // Fragment default focus can run after popstate and React's layout effect.
      // Settle once, while respecting a user's subsequent focus/leave choice.
      const frame = requestAnimationFrame(() => {
        if (
          heading?.isConnected &&
          (document.activeElement === document.body ||
            document.activeElement === document.documentElement)
        )
          heading.focus();
      });
      return () => cancelAnimationFrame(frame);
    } else if (wasConfirming.current) {
      if (returnFocus.current?.isConnected) returnFocus.current.focus();
      else nameRef.current?.querySelector('input')?.focus();
    }
    wasConfirming.current = confirming;
  }, [confirming]);

  function abandon() {
    setName('');
    setSelected([]);
    setSearch('');
    setSubmittedSearch('');
    setError('');
    if (view === 'edit') {
      setFocusEdit(true);
      setView('detail');
    } else {
      setView('collection');
      requestAnimationFrame(() =>
        createRef.current?.querySelector('button')?.focus()
      );
    }
  }

  function requestLeave(action?: () => void, fromHistory = false) {
    if (saving) return;
    if (!dirty) {
      if (action) action();
      else abandon();
      return;
    }
    if (confirming) return;
    const active = document.activeElement;
    const previous = lastEditorFocus.current;
    returnFocus.current =
      fromHistory ||
      active === document.body ||
      active === document.documentElement
        ? previous?.isConnected && editorRef.current?.contains(previous)
          ? previous
          : (nameRef.current?.querySelector('input') ?? null)
        : (active as HTMLElement);
    pendingLeave.current = action;
    setConfirming(true);
  }

  useEffect(() => {
    if (!editing) return;
    function escape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (confirming) setConfirming(false);
      else requestLeave();
    }
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  });

  const historyNotice = useInviteListNavigationGuard(dirty, leave =>
    requestLeave(leave, true)
  );

  async function save() {
    setError('');
    if (!name.trim() || name.trim().length > 100) {
      setError('Use a list name with 1–100 characters after trimming.');
      return;
    }
    if (!selected.length) {
      setError('Choose at least one existing person.');
      return;
    }
    setSaving(true);
    try {
      const values = {
        name: name.trim(),
        personIds: selected.map(person => person.personId),
      };
      const detail =
        view === 'edit' && detailId
          ? await update({ inviteListId: detailId, ...values })
          : await create(values);
      setDetailId(detail.inviteListId);
      setView('detail');
      setFocusEdit(false);
      setFocusDelete(false);
      setSaved(true);
      setName('');
      setSelected([]);
      setSearch('');
      setSubmittedSearch('');
    } catch (failure) {
      const data = failure instanceof ConvexError ? failure.data : undefined;
      setError(
        data &&
          typeof data === 'object' &&
          'message' in data &&
          typeof data.message === 'string'
          ? data.message
          : 'Unable to save this list. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteList() {
    if (!detailId) return;
    setSaving(true);
    setError('');
    try {
      await remove({ inviteListId: detailId });
      setView('collection');
      setSaved(false);
      setDeleted(true);
      requestAnimationFrame(() =>
        createRef.current?.querySelector('button')?.focus()
      );
    } catch {
      setError('Unable to delete this list. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsPageTemplate
      title='Invite lists'
      description='Private lists of people you can invite later. Saving a list does not notify anyone.'
    >
      <div className='flex flex-col gap-4'>
        {historyNotice && <p role='alert'>{historyNotice}</p>}
        {saved && (
          <Alert variant='success' role='status'>
            <AlertDescription>
              List saved. No invitations were sent.
            </AlertDescription>
          </Alert>
        )}
        {deleted && (
          <Alert variant='success' role='status'>
            <AlertDescription>
              List deleted. Existing invitations are unchanged.
            </AlertDescription>
          </Alert>
        )}
        {view === 'collection' && (
          <QuerySection message='Unable to load your invite lists.'>
            <ListCollection
              createRef={createRef}
              focusListId={focusListId}
              startCreate={() => {
                setView('create');
                setInitialDraft({ name: '', personIds: [] });
                setSaved(false);
                setDeleted(false);
                setFocusListId(undefined);
              }}
              inspect={id => {
                setDetailId(id);
                setView('detail');
                setSaved(false);
                setDeleted(false);
                setFocusEdit(false);
                setFocusDelete(false);
              }}
            />
          </QuerySection>
        )}
        {view === 'detail' && detailId && (
          <>
            <Button
              variant='outline'
              onClick={() => {
                setFocusListId(detailId);
                setView('collection');
              }}
            >
              Back to invite lists
            </Button>
            <QuerySection message='Unable to load this invite list.'>
              <ListDetail
                id={detailId}
                focusEdit={focusEdit}
                focusDelete={focusDelete}
                remove={list => {
                  setDeleteName(list.name);
                  setError('');
                  setView('delete');
                  setSaved(false);
                }}
                edit={list => {
                  setName(list.name);
                  setSelected(list.people);
                  setInitialDraft({
                    name: list.name,
                    personIds: list.people.map(person => person.personId),
                  });
                  setSaved(false);
                  setError('');
                  setSearch('');
                  setSubmittedSearch('');
                  setView('edit');
                }}
              />
            </QuerySection>
          </>
        )}
        {view === 'delete' && (
          <section
            className='flex flex-col gap-4'
            aria-labelledby='invite-list-delete-title'
          >
            <h2
              id='invite-list-delete-title'
              tabIndex={-1}
              ref={deleteHeading}
              className='break-words text-xl font-heading'
            >
              Delete this invite list?
            </h2>
            <p>{deleteName}</p>
            <p>
              Existing invitations and event participation will stay unchanged.
            </p>
            {error && (
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className='flex flex-wrap gap-2'>
              <Button
                variant='outline'
                disabled={saving}
                onClick={() => {
                  setFocusEdit(false);
                  setFocusDelete(true);
                  setError('');
                  setView('detail');
                }}
              >
                Keep list
              </Button>
              <Button
                variant='destructive'
                onClick={deleteList}
                isLoading={saving}
                loadingText='Deleting list…'
              >
                Delete list
              </Button>
            </div>
          </section>
        )}
        {confirming && (
          <section
            aria-labelledby='invite-list-discard-title'
            className='flex flex-col gap-4'
          >
            <h2
              id='invite-list-discard-title'
              ref={confirmationRef}
              tabIndex={-1}
              className='break-words text-xl font-heading'
            >
              {view === 'edit'
                ? 'Discard changes to this invite list?'
                : 'Discard this invite list?'}
            </h2>
            <p>Your unsaved name and people will be lost.</p>
            <div className='flex flex-wrap gap-2'>
              <Button onClick={() => setConfirming(false)}>Keep Editing</Button>
              <Button
                variant='destructive'
                onClick={() => {
                  const leave = pendingLeave.current;
                  pendingLeave.current = undefined;
                  setConfirming(false);
                  abandon();
                  leave?.();
                }}
              >
                Discard
              </Button>
            </div>
          </section>
        )}
        {editing && (
          <fieldset
            ref={editorRef}
            onFocusCapture={event => {
              lastEditorFocus.current = event.target as HTMLElement;
            }}
            disabled={saving}
            hidden={confirming}
            className={cn('flex flex-col gap-4', confirming && 'hidden')}
          >
            <h2 className='break-words text-xl font-heading'>
              {view === 'edit' ? 'Edit invite list' : 'Create invite list'}
            </h2>
            <div className='flex flex-col gap-2' ref={nameRef}>
              <Label htmlFor='invite-list-name'>List name</Label>
              <Input
                id='invite-list-name'
                value={name}
                aria-describedby='invite-list-name-help'
                onChange={event => setName(event.target.value)}
                disabled={saving}
              />
              <p
                id='invite-list-name-help'
                className='text-sm text-muted-foreground'
              >
                Only you can see this list. Use up to 100 characters after
                trimming.
              </p>
            </div>
            <section
              aria-label='Selected people'
              className='flex flex-col gap-2'
            >
              <h3 className='font-medium'>
                Selected people ({selected.length}/100)
              </h3>
              <QuerySection message='Unable to check selected people. Your list draft is preserved.'>
                <InviteListSelectedPeople
                  selected={selected}
                  disabled={saving}
                  remove={id =>
                    setSelected(
                      selected.filter(person => person.personId !== id)
                    )
                  }
                />
              </QuerySection>
            </section>
            <form
              className='flex items-end gap-2'
              onSubmit={event => {
                event.preventDefault();
                if (search.trim().length >= 2)
                  setSubmittedSearch(search.trim());
              }}
            >
              <div className='min-w-0 flex-1 flex flex-col gap-2'>
                <Label htmlFor='invite-list-search'>Search by username</Label>
                <Input
                  id='invite-list-search'
                  aria-describedby='invite-list-search-help'
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  disabled={saving}
                />
              </div>
              <Button
                type='submit'
                variant='outline'
                disabled={search.trim().length < 2 || saving}
              >
                Search
              </Button>
            </form>
            <p
              id='invite-list-search-help'
              className='text-sm text-muted-foreground'
            >
              Enter at least 2 characters, then choose Search.
            </p>
            {submittedSearch && (
              <Button
                variant='ghost'
                onClick={() => {
                  setSearch('');
                  setSubmittedSearch('');
                }}
              >
                Show friends
              </Button>
            )}
            <QuerySection
              key={submittedSearch}
              message='Unable to load people.'
            >
              <InviteListPersonChoices
                search={submittedSearch}
                selected={selected}
                add={person => setSelected([...selected, person])}
              />
            </QuerySection>
            {error && (
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className='flex flex-wrap gap-2'>
              <Button
                onClick={save}
                isLoading={saving}
                loadingText='Saving list…'
              >
                Save list
              </Button>
              <Button
                variant='outline'
                disabled={saving}
                onClick={() => requestLeave()}
              >
                Cancel
              </Button>
            </div>
          </fieldset>
        )}
      </div>
    </SettingsPageTemplate>
  );
}
