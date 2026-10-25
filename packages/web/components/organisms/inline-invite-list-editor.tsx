'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QuerySection } from '@/components/molecules/query-section';
import {
  InviteListPersonChoices,
  InviteListSelectedPeople,
} from './invite-list-people';
import { useCreateInviteList } from '@/hooks/convex/use-invite-lists';
import { useInviteListNavigationGuard } from '@/hooks/use-invite-list-navigation-guard';

type Detail = Awaited<ReturnType<ReturnType<typeof useCreateInviteList>>>;
type Person = Detail['people'][number];

/** A screen in the existing invitation dialog; the invitation view stays mounted. */
export function InlineInviteListEditor({
  finish,
  registerDismiss,
}: {
  finish: (detail?: Detail, use?: boolean) => void;
  registerDismiss: (dismiss: (() => void) | undefined) => void;
}) {
  const create = useCreateInviteList();
  const [name, setName] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const nameRef = useRef<HTMLDivElement>(null);
  const confirmationRef = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const editorRef = useRef<HTMLFieldSetElement>(null);
  const lastEditorFocus = useRef<HTMLElement | null>(null);
  const wasConfirming = useRef(false);
  const requestRef = useRef<() => void>(() => {});
  const dirty = name !== '' || people.length > 0;
  useEffect(() => {
    nameRef.current?.querySelector('input')?.focus();
  }, []);
  useLayoutEffect(() => {
    if (confirming) {
      const heading = confirmationRef.current;
      heading?.focus();
      wasConfirming.current = true;
      // Native fragment focus settles after popstate. Repair body focus once;
      // cleanup and the active-control check preserve subsequent user choices.
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

  function requestLeave(fromHistory = false) {
    if (saving || confirming) return;
    if (!dirty) {
      finish();
      return;
    }
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
    setConfirming(true);
  }
  useLayoutEffect(() => {
    requestRef.current = requestLeave;
  });
  useLayoutEffect(() => {
    registerDismiss(() => requestRef.current());
    return () => registerDismiss(undefined);
  }, [registerDismiss]);
  // Browser navigation returns to the prior invitation screen after Discard.
  const historyNotice = useInviteListNavigationGuard(
    true,
    () => requestLeave(true),
    dirty
  );

  async function save(use: boolean) {
    setError('');
    if (!name.trim() || name.trim().length > 100) {
      setError('Use a list name with 1–100 characters after trimming.');
      return;
    }
    if (!people.length) {
      setError('Choose at least one existing person.');
      return;
    }
    setSaving(true);
    try {
      const detail = await create({
        name: name.trim(),
        personIds: people.map(person => person.personId),
      });
      finish(detail, use);
    } catch {
      setError(
        'Unable to save this list. Your name and people are preserved. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-label='Create invite list' className='flex flex-col gap-4'>
      {historyNotice && <p role='alert'>{historyNotice}</p>}
      {confirming && (
        <section
          aria-labelledby='inline-list-discard-title'
          className='flex flex-col gap-4'
        >
          <h2
            id='inline-list-discard-title'
            tabIndex={-1}
            ref={confirmationRef}
            className='font-heading text-xl'
          >
            Discard this invite list?
          </h2>
          <p>
            Your unsaved list will be lost. Your invitation selection will be
            preserved.
          </p>
          <div className='flex flex-wrap gap-2'>
            <Button onClick={() => setConfirming(false)}>Keep Editing</Button>
            <Button variant='destructive' onClick={() => finish()}>
              Discard
            </Button>
          </div>
        </section>
      )}
      <fieldset
        ref={editorRef}
        onFocusCapture={event => {
          lastEditorFocus.current = event.target as HTMLElement;
        }}
        disabled={saving}
        hidden={confirming}
        className={cn('flex flex-col gap-4', confirming && 'hidden')}
      >
        <h2 className='font-heading text-xl'>Create invite list</h2>
        <p className='text-sm text-muted-foreground'>
          Saving a private list does not send invitations or notify anyone.
        </p>
        <Button variant='outline' onClick={() => requestLeave()}>
          Back to invitations
        </Button>
        <div ref={nameRef} className='flex flex-col gap-2'>
          <Label htmlFor='inline-list-name'>List name</Label>
          <Input
            id='inline-list-name'
            value={name}
            aria-describedby='inline-list-name-help'
            onChange={event => setName(event.target.value)}
          />
          <p
            id='inline-list-name-help'
            className='text-sm text-muted-foreground'
          >
            Only you can see this list. Use up to 100 characters.
          </p>
        </div>
        <section aria-label='Selected people' className='flex flex-col gap-2'>
          <h3 className='font-medium'>Selected people ({people.length}/100)</h3>
          <QuerySection message='Unable to check selected people. Your list draft is preserved.'>
            <InviteListSelectedPeople
              selected={people}
              disabled={saving}
              remove={id =>
                setPeople(people.filter(person => person.personId !== id))
              }
            />
          </QuerySection>
        </section>
        <form
          className='flex items-end gap-2'
          onSubmit={event => {
            event.preventDefault();
            if (search.trim().length >= 2) setSubmittedSearch(search.trim());
          }}
        >
          <div className='min-w-0 flex-1 flex flex-col gap-2'>
            <Label htmlFor='inline-list-search'>Search by username</Label>
            <Input
              id='inline-list-search'
              aria-describedby='inline-list-search-help'
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>
          <Button
            type='submit'
            variant='outline'
            disabled={search.trim().length < 2}
          >
            Search
          </Button>
        </form>
        <p
          id='inline-list-search-help'
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
          message='Unable to load people. Your list draft is preserved.'
        >
          <InviteListPersonChoices
            search={submittedSearch}
            selected={people}
            add={person => setPeople([...people, person])}
          />
        </QuerySection>
        {error && (
          <p role='alert' className='text-error'>
            {error}
          </p>
        )}
        <div className='flex flex-wrap gap-2'>
          <Button
            variant='outline'
            onClick={() => save(false)}
            isLoading={saving}
            loadingText='Saving list…'
          >
            Save
          </Button>
          <Button onClick={() => save(true)} disabled={saving}>
            Save and use
          </Button>
          <Button variant='outline' onClick={() => requestLeave()}>
            Cancel
          </Button>
        </div>
      </fieldset>
    </section>
  );
}
