'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useInviteListNavigationGuard } from '@/hooks/use-invite-list-navigation-guard';
import { QuerySection } from '@/components/molecules/query-section';
import { ConvexError } from 'convex/values';
import { SettingsPageTemplate } from '@/components/templates/settings-page-template';
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
        <p className='text-muted-foreground'>No invite lists yet</p>
      )}
      {lists.items.map(list => (
        <Button
          key={list.inviteListId}
          variant='outline'
          className='w-full justify-between'
          autoFocus={focusListId === list.inviteListId}
          aria-label={`View ${list.name}, ${list.personCount} ${list.personCount === 1 ? 'person' : 'people'}`}
          onClick={() => inspect(list.inviteListId)}
        >
          <span>{list.name}</span>
          <span>
            {list.personCount} {list.personCount === 1 ? 'person' : 'people'}
            {list.needsAttention ? ' · Needs attention' : ''}
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
    <section className='space-y-3'>
      <h2 tabIndex={-1} ref={headingRef} className='text-xl font-heading'>
        {list.name}
      </h2>
      {list.needsAttention && <p role='status'>Needs attention</p>}
      <p className='text-muted-foreground'>{list.personCount} people</p>
      {list.people.map((person, index) => (
        <InviteListPersonRow key={index} person={person} />
      ))}
      <div className='flex gap-2'>
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
  const pendingLeave = useRef<() => void>(() => {});
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
    if (confirming) confirmationRef.current?.focus();
    else if (wasConfirming.current) returnFocus.current?.focus();
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

  function requestLeave(action: () => void = abandon) {
    if (saving) return;
    if (!dirty) {
      action();
      return;
    }
    if (confirming) return;
    returnFocus.current = document.activeElement as HTMLElement;
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

  const historyNotice = useInviteListNavigationGuard(dirty, requestLeave);

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
      <div className='space-y-4'>
        {historyNotice && <p role='alert'>{historyNotice}</p>}
        {saved && <p role='status'>List saved. No invitations were sent.</p>}
        {deleted && (
          <p role='status'>List deleted. Existing invitations are unchanged.</p>
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
            className='space-y-4'
            aria-labelledby='invite-list-delete-title'
          >
            <h2
              id='invite-list-delete-title'
              tabIndex={-1}
              ref={deleteHeading}
              className='text-xl font-heading'
            >
              Delete this invite list?
            </h2>
            <p>{deleteName}</p>
            <p>
              Existing invitations and event participation will stay unchanged.
            </p>
            {error && (
              <p role='alert' className='text-error'>
                {error}
              </p>
            )}
            <div className='flex gap-2'>
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
            className='space-y-4'
          >
            <h2
              id='invite-list-discard-title'
              ref={confirmationRef}
              tabIndex={-1}
              className='text-xl font-heading'
            >
              {view === 'edit'
                ? 'Discard changes to this invite list?'
                : 'Discard this invite list?'}
            </h2>
            <p>Your unsaved name and people will be lost.</p>
            <div className='flex gap-2'>
              <Button onClick={() => setConfirming(false)}>Keep Editing</Button>
              <Button
                variant='destructive'
                onClick={() => {
                  setConfirming(false);
                  pendingLeave.current();
                }}
              >
                Discard
              </Button>
            </div>
          </section>
        )}
        {editing && (
          <fieldset disabled={saving} hidden={confirming} className='space-y-4'>
            <h2 className='text-xl font-heading'>
              {view === 'edit' ? 'Edit invite list' : 'Create invite list'}
            </h2>
            <div className='space-y-2' ref={nameRef}>
              <Label htmlFor='invite-list-name'>List name</Label>
              <Input
                id='invite-list-name'
                value={name}
                onChange={event => setName(event.target.value)}
                disabled={saving}
              />
            </div>
            <section aria-label='Selected people' className='space-y-2'>
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
              <div className='flex-1 space-y-2'>
                <Label htmlFor='invite-list-search'>Search by username</Label>
                <Input
                  id='invite-list-search'
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
              <p role='alert' className='text-error'>
                {error}
              </p>
            )}
            <div className='flex gap-2'>
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
