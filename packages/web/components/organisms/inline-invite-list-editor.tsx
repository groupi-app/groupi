'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  const wasConfirming = useRef(false);
  const requestRef = useRef<() => void>(() => {});
  const dirty = name !== '' || people.length > 0;
  useEffect(() => {
    nameRef.current?.querySelector('input')?.focus();
  }, []);
  useLayoutEffect(() => {
    if (confirming) confirmationRef.current?.focus();
    else if (wasConfirming.current) returnFocus.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);

  function requestLeave() {
    if (saving || confirming) return;
    if (!dirty) {
      finish();
      return;
    }
    returnFocus.current = document.activeElement as HTMLElement;
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
  const historyNotice = useInviteListNavigationGuard(true, requestLeave, dirty);

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
    <section aria-label='Create invite list' className='space-y-4'>
      {historyNotice && <p role='alert'>{historyNotice}</p>}
      {confirming && (
        <section
          aria-labelledby='inline-list-discard-title'
          className='space-y-4'
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
          <div className='flex gap-2'>
            <Button onClick={() => setConfirming(false)}>Keep Editing</Button>
            <Button variant='destructive' onClick={() => finish()}>
              Discard
            </Button>
          </div>
        </section>
      )}
      <fieldset disabled={saving} hidden={confirming} className='space-y-4'>
        <h2 className='font-heading text-xl'>Create invite list</h2>
        <p className='text-sm text-muted-foreground'>
          Saving a private list does not send invitations or notify anyone.
        </p>
        <Button variant='outline' onClick={requestLeave}>
          Back to invitations
        </Button>
        <div ref={nameRef} className='space-y-2'>
          <Label htmlFor='inline-list-name'>List name</Label>
          <Input
            id='inline-list-name'
            value={name}
            onChange={event => setName(event.target.value)}
          />
        </div>
        <section aria-label='Selected people' className='space-y-2'>
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
          <div className='flex-1 space-y-2'>
            <Label htmlFor='inline-list-search'>Search by username</Label>
            <Input
              id='inline-list-search'
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
            onClick={() => save(false)}
            isLoading={saving}
            loadingText='Saving list…'
          >
            Save
          </Button>
          <Button onClick={() => save(true)} disabled={saving}>
            Save and use
          </Button>
          <Button variant='outline' onClick={requestLeave}>
            Cancel
          </Button>
        </div>
      </fieldset>
    </section>
  );
}
