'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  useEventSettings,
  useSaveEventSettings,
} from '@/hooks/convex/use-event-settings';
import { useFileUpload } from '@/hooks/convex/use-file-upload';
import type { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { dateTimestamp } from './date-values';

type Snapshot = NonNullable<ReturnType<typeof useEventSettings>>;
type Patch = Parameters<ReturnType<typeof useSaveEventSettings>>[0]['patch'];
type EditableKey = keyof Patch;
type Values = Omit<Snapshot, 'details' | 'audiences'> & {
  details: Omit<Snapshot['details'], 'imageStorageId' | 'imageFocalPoint'> &
    Pick<NonNullable<Patch['details']>, 'imageStorageId' | 'imageFocalPoint'>;
  audiences: Snapshot['audiences'] & { groupIds?: Id<'groups'>[] };
};
export type EventDateDraft = {
  mode: 'SINGLE' | 'POLL';
  start: string;
  end: string;
  options: {
    id?: Id<'potentialDateTimes'>;
    start: string;
    end: string;
    note: string;
  }[];
};
type Draft = { base: Snapshot; patch: Patch; imageFile: File | null };
// Memory-only, actor-scoped recovery for App Router Back/Forward across Event
// layouts. Never serialize application answers or selected File bytes to storage.
const recoveredDrafts = new Map<
  string,
  {
    draft: Draft | null;
    dateForm: EventDateDraft | null;
    audienceNames: Record<string, string>;
  }
>();
type ContextValue = {
  snapshot: Snapshot;
  values: Values;
  patch: Patch;
  busy: boolean;
  epoch: number;
  audienceNames: Record<string, string>;
  rememberAudience: (id: string, name: string) => void;
  dateForm: EventDateDraft | null;
  setDateForm: (form: EventDateDraft | null) => void;
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  setSection: <K extends EditableKey>(
    key: K,
    value: NonNullable<Patch[K]>
  ) => void;
};
const Context = createContext<ContextValue | null>(null);
export function useEventSettingsDraft() {
  const value = useContext(Context);
  if (!value) throw new Error('Event settings are not available.');
  return value;
}
export function useOptionalEventSettingsDraft() {
  return useContext(Context);
}

export function EventSettingsDraftProvider({
  eventId,
  enabled,
  actorId,
  children,
}: {
  actorId: string;
  eventId: Id<'events'>;
  enabled: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  useEffect(() => {
    if (!enabled) recoveredDrafts.delete(`${actorId}:${eventId}`);
  }, [enabled, actorId, eventId]);
  const settingsRoot = `/event/${eventId}/settings`;
  const inSettings =
    pathname === settingsRoot || pathname.startsWith(`${settingsRoot}/`);
  // Keep the subscription and draft alive when navigating back to the Event.
  const [visited, setVisited] = useState(inSettings);
  if (inSettings && !visited) setVisited(true);
  const snapshot = useEventSettings(
    enabled && (inSettings || visited) ? { eventId } : 'skip'
  );
  if (enabled && inSettings && snapshot === undefined)
    return (
      <p role='status' className='p-4'>
        Loading event settings…
      </p>
    );
  return enabled && snapshot ? (
    <LoadedDraft
      key={`${actorId}:${eventId}`}
      cacheKey={`${actorId}:${eventId}`}
      eventId={eventId}
      snapshot={snapshot}
      inSettings={inSettings}
    >
      {children}
    </LoadedDraft>
  ) : (
    <>{children}</>
  );
}
function LoadedDraft({
  cacheKey,
  eventId,
  snapshot: remote,
  inSettings,
  children,
}: {
  cacheKey: string;
  eventId: Id<'events'>;
  snapshot: Snapshot;
  inSettings: boolean;
  children: ReactNode;
}) {
  const saveMutation = useSaveEventSettings();
  const { uploadFile } = useFileUpload();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(
    () => recoveredDrafts.get(cacheKey)?.draft ?? null
  );
  const [acknowledged, setAcknowledged] = useState<{
    previousRevision: string;
    snapshot: Snapshot;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [audienceNames, setAudienceNames] = useState<Record<string, string>>(
    () => recoveredDrafts.get(cacheKey)?.audienceNames ?? {}
  );
  const pending = useRef(false);
  const [error, setError] = useState('');
  const [dateForm, setDateFormState] = useState<EventDateDraft | null>(
    () => recoveredDrafts.get(cacheKey)?.dateForm ?? null
  );
  const [confirmDate, setConfirmDate] = useState(false);
  const uploadedCover = useRef<{
    file: File;
    storageId: Id<'_storage'>;
  } | null>(null);
  const [epoch, setEpoch] = useState(0);
  const [destination, setDestination] = useState<string | null>(null);
  const snapshot =
    acknowledged && remote.revision === acknowledged.previousRevision
      ? acknowledged.snapshot
      : remote;
  const base = draft?.base ?? snapshot;
  const patch = draft?.patch ?? {};
  const dirty =
    Object.keys(patch).length > 0 ||
    Boolean(draft?.imageFile) ||
    dateForm !== null;
  useEffect(() => {
    if (dirty)
      recoveredDrafts.set(cacheKey, { draft, dateForm, audienceNames });
    else recoveredDrafts.delete(cacheKey);
  }, [cacheKey, dirty, draft, dateForm, audienceNames]);
  const values = {
    ...base,
    ...patch,
    role: remote.role,
    details: { ...base.details, ...patch.details },
    audiences: {
      ...base.audiences,
      friendsShared:
        patch.details?.visibility !== undefined &&
        patch.details.visibility !== base.details.visibility
          ? patch.details.visibility === 'FRIENDS'
          : base.audiences.friendsShared,
      ...patch.audiences,
    },
    date: patch.date
      ? patch.date.mode === 'SINGLE'
        ? {
            ...base.date,
            chosenDateTime: patch.date.start,
            chosenEndDateTime: patch.date.end,
          }
        : { options: patch.date.options ?? base.date.options }
      : base.date,
  } as Values;
  const setSection: ContextValue['setSection'] = (key, value) => {
    if (pending.current) return;
    setError('');
    setDraft(current => {
      const original = current?.base ?? snapshot;
      const next = { ...current?.patch, [key]: value };
      if (
        key !== 'audiences' &&
        JSON.stringify(value) ===
          JSON.stringify(original[key as keyof Snapshot])
      )
        delete next[key];
      // Details are applied before audiences by the atomic write. Compare an
      // explicit audience choice to that effective baseline, not the old grant,
      // so a later Shared with change can override visibility's Friends effect.
      const effectiveFriends =
        next.details?.visibility !== undefined &&
        next.details.visibility !== original.details.visibility
          ? next.details.visibility === 'FRIENDS'
          : original.audiences.friendsShared;
      const originalGroups = original.audiences.groups
        .map(group => group.groupId)
        .sort();
      if (
        next.audiences &&
        next.audiences.friendsShared === effectiveFriends &&
        JSON.stringify([...next.audiences.groupIds].sort()) ===
          JSON.stringify(originalGroups)
      )
        delete next.audiences;
      return Object.keys(next).length === 0 && !current?.imageFile && !dateForm
        ? null
        : {
            base: original,
            patch: next,
            imageFile: current?.imageFile ?? null,
          };
    });
  };
  const setImageFile = (imageFile: File | null) => {
    if (pending.current) return;
    setDraft(current =>
      !imageFile && Object.keys(current?.patch ?? {}).length === 0 && !dateForm
        ? null
        : {
            base: current?.base ?? snapshot,
            patch: current?.patch ?? {},
            imageFile,
          }
    );
  };
  const setDateForm = (form: EventDateDraft | null) => {
    if (pending.current) return;
    setDateFormState(form);
    setDraft(current =>
      !form &&
      Object.keys(current?.patch ?? {}).length === 0 &&
      !current?.imageFile
        ? null
        : (current ?? { base: snapshot, patch: {}, imageFile: null })
    );
    setError('');
  };
  const revert = () => {
    if (pending.current) return;
    setDateFormState(null);
    uploadedCover.current = null;
    setDraft(null);
    setError('');
    setEpoch(value => value + 1);
  };
  async function save(confirmedReset = false) {
    if (pending.current || !dirty || !draft) return false;
    let finalPatch = draft.patch;
    if (dateForm) {
      const start = dateTimestamp(dateForm.start, base.date.chosenDateTime),
        end = dateTimestamp(dateForm.end, base.date.chosenEndDateTime);
      const options = dateForm.options.map(option => {
        const original = option.id
          ? base.date.options.find(saved => saved.id === option.id)
          : undefined;
        return {
          id: option.id,
          start: dateTimestamp(option.start, original?.start)!,
          end: dateTimestamp(option.end, original?.end),
          note: option.note.trim() || undefined,
        };
      });
      if (
        dateForm.mode === 'SINGLE'
          ? !Number.isFinite(start) ||
            (end !== undefined && (!Number.isFinite(end) || end <= start!))
          : options.length < 2 ||
            options.some(
              option =>
                !Number.isFinite(option.start) ||
                (option.end !== undefined &&
                  (!Number.isFinite(option.end) || option.end <= option.start))
            )
      ) {
        setError('Choose valid dates and times before saving.');
        return false;
      }
      const destructive =
        base.date.completedAt !== undefined ||
        (dateForm.mode === 'SINGLE'
          ? base.date.options.length > 0 ||
            (base.date.chosenDateTime !== undefined &&
              (base.date.chosenDateTime !== start ||
                base.date.chosenEndDateTime !== end))
          : base.date.chosenDateTime !== undefined ||
            base.date.options.some(
              old =>
                !options.some(
                  option =>
                    option.id === old.id &&
                    option.start === old.start &&
                    option.end === old.end
                )
            ));
      if (destructive && !confirmedReset) {
        setConfirmDate(true);
        return false;
      }
      finalPatch = {
        ...finalPatch,
        date:
          dateForm.mode === 'SINGLE'
            ? { mode: 'SINGLE', start, end, confirmedReset: destructive }
            : { mode: 'POLL', options, confirmedReset: destructive },
      };
    }
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      if (draft.imageFile) {
        if (uploadedCover.current?.file !== draft.imageFile) {
          const uploaded = await uploadFile(draft.imageFile, 'cover');
          if (!uploaded)
            throw new Error(
              'Unable to upload cover image. Your edits are still here.'
            );
          uploadedCover.current = {
            file: draft.imageFile,
            storageId: uploaded.storageId as Id<'_storage'>,
          };
        }
        finalPatch = {
          ...finalPatch,
          details: {
            ...base.details,
            ...finalPatch.details,
            imageStorageId: uploadedCover.current.storageId,
          },
        };
      }
      if (finalPatch.details) {
        const {
          title,
          description,
          location,
          visibility,
          imageStorageId,
          imageFocalPoint,
        } = finalPatch.details;
        finalPatch = {
          ...finalPatch,
          details: {
            title,
            description,
            location,
            visibility,
            imageStorageId,
            imageFocalPoint,
          },
        };
      }
      const result = await saveMutation({
        eventId,
        expectedRevision: base.revision,
        patch: finalPatch,
      });
      setAcknowledged({ previousRevision: remote.revision, snapshot: result });
      setDraft(null);
      setDateFormState(null);
      setConfirmDate(false);
      uploadedCover.current = null;
      setEpoch(value => value + 1);
      if (destination) {
        setDestination(null);
        router.push(destination);
      }
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to save changes. Your edits are still here.'
      );
      return false;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    const click = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = (event.target as Element | null)?.closest('a[href]');
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download')
      )
        return;
      const target = new URL(anchor.href, location.href);
      if (
        target.origin === location.origin &&
        (target.pathname === `/event/${eventId}` ||
          target.pathname.startsWith(`/event/${eventId}/`))
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      setDestination(anchor.href);
    };
    window.addEventListener('beforeunload', unload);
    document.addEventListener('click', click, true);
    return () => {
      window.removeEventListener('beforeunload', unload);
      document.removeEventListener('click', click, true);
    };
  }, [dirty, eventId]);
  return (
    <Context.Provider
      value={{
        snapshot: base,
        values,
        patch,
        busy,
        epoch,
        dateForm,
        setDateForm,
        audienceNames,
        rememberAudience: (id, name) =>
          setAudienceNames(current => ({ ...current, [id]: name })),
        imageFile: draft?.imageFile ?? null,
        setImageFile,
        setSection,
      }}
    >
      {children}
      {inSettings && dirty && <div aria-hidden className='h-32' />}
      {inSettings && dirty && (
        <div
          className='fixed inset-x-4 bottom-20 z-sticky mx-auto flex max-w-3xl flex-wrap items-center justify-end gap-2 rounded-card border border-border bg-card p-3 shadow-raised'
          aria-label='Event settings changes'
        >
          {!error && base.revision !== snapshot.revision && (
            <p role='status' className='w-full text-sm text-muted-foreground'>
              Settings changed elsewhere. Revert to load the current settings.
            </p>
          )}
          {error && (
            <p role='alert' className='w-full break-words text-sm text-error'>
              {error}
            </p>
          )}
          <Button variant='ghost' disabled={busy} onClick={revert}>
            Revert
          </Button>
          <Button isLoading={busy} disabled={busy} onClick={() => void save()}>
            Save changes
          </Button>
        </div>
      )}
      <Dialog
        open={confirmDate}
        onOpenChange={open => {
          if (!busy) setConfirmDate(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace event dates?</DialogTitle>
            <DialogDescription>
              {dateForm?.mode === 'SINGLE'
                ? 'Change the chosen event date. Existing poll history will be retained.'
                : 'Changing or removing existing poll options clears affected votes.'}{' '}
              Other event settings will be saved together.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='ghost'
              disabled={busy}
              onClick={() => setConfirmDate(false)}
            >
              Keep editing
            </Button>
            <Button
              isLoading={busy}
              disabled={busy}
              onClick={() => void save(true)}
            >
              Confirm and save
            </Button>
          </DialogFooter>
          {error && (
            <p role='alert' className='text-sm text-error'>
              {error}
            </p>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={destination !== null && !confirmDate}
        onOpenChange={open => {
          if (!open && !busy) setDestination(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved event settings</DialogTitle>
            <DialogDescription>
              Save your changes or revert them before leaving.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='ghost'
              disabled={busy}
              onClick={() => setDestination(null)}
            >
              Keep editing
            </Button>
            <Button
              variant='outline'
              disabled={busy}
              onClick={() => {
                const target = destination;
                revert();
                setDestination(null);
                if (target) router.push(target);
              }}
            >
              Revert and leave
            </Button>
            <Button
              isLoading={busy}
              disabled={busy}
              onClick={() => void save()}
            >
              Save and leave
            </Button>
          </DialogFooter>
          {error && (
            <p role='alert' className='text-sm text-error'>
              {error}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </Context.Provider>
  );
}
