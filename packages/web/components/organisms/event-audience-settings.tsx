'use client';
import { useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useEventSettingsAudienceOptions } from '@/hooks/convex/use-event-settings';
import { useEventSettingsDraft } from '@/features/event-settings';

export function EventAudienceSettings({
  eventId,
}: {
  eventId: Id<'events'>;
  visibility: Doc<'events'>['visibility'];
}) {
  const { values, setSection, busy, audienceNames, rememberAudience } =
    useEventSettingsDraft();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const groups = useEventSettingsAudienceOptions({
    eventId,
    search,
    paginationOpts: { cursor, numItems: 50 },
  });
  const selected = values.audiences;
  const selectedIds =
    selected.groupIds ?? selected.groups.map(group => group.groupId);
  const candidates = groups?.page ?? [];
  const namesById = {
    ...Object.fromEntries(
      selected.groups.map(group => [group.groupId, group.name])
    ),
    ...Object.fromEntries(candidates.map(group => [group.groupId, group.name])),
    ...audienceNames,
  };
  const update = (friendsShared: boolean, groupIds: Id<'groups'>[]) =>
    setSection('audiences', { friendsShared, groupIds });
  const toggle = (groupId: Id<'groups'>, name: string) => {
    rememberAudience(groupId, name);
    update(
      Boolean(selected.friendsShared),
      selectedIds.includes(groupId)
        ? selectedIds.filter(id => id !== groupId)
        : [...selectedIds, groupId]
    );
  };
  const removable = (groupId: Id<'groups'>) =>
    selected.groups.find(group => group.groupId === groupId)?.canWithdraw !==
    false;
  const filtered = candidates;
  return (
    <div className='min-w-0 space-y-2'>
      <Label id='event-shared-with-label'>Shared with</Label>
      <div className='flex min-w-0 flex-wrap gap-2'>
        {selected.friendsShared && (
          <AudienceChip
            name='Friends'
            disabled={busy}
            onRemove={() => update(false, selectedIds)}
          />
        )}
        {selectedIds.map(id => (
          <AudienceChip
            key={id}
            name={namesById[id] ?? 'Selected group'}
            disabled={busy || !removable(id)}
            onRemove={() =>
              update(
                Boolean(selected.friendsShared),
                selectedIds.filter(groupId => groupId !== id)
              )
            }
          />
        ))}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            disabled={busy}
            className='w-full justify-between'
            aria-labelledby='event-shared-with-label'
            aria-label='Choose audiences'
          >
            <span>Choose audiences</span>
            <ChevronDown className='size-4 shrink-0' aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent align='start' className='w-72 max-w-full p-2'>
          <Input
            aria-label='Search audiences'
            placeholder='Search groups…'
            value={search}
            onChange={event => {
              setSearch(event.target.value);
              setCursor(null);
            }}
          />
          <fieldset className='mt-2 max-h-72 overflow-y-auto' disabled={busy}>
            <legend className='sr-only'>Event audiences</legend>
            {(!search || 'friends'.includes(search.toLocaleLowerCase())) && (
              <label className='flex min-h-10 cursor-pointer items-center gap-2 rounded-input px-2 py-2 hover:bg-accent'>
                <input
                  type='checkbox'
                  className='size-4 shrink-0 accent-primary'
                  checked={Boolean(selected.friendsShared)}
                  onChange={() => update(!selected.friendsShared, selectedIds)}
                />
                <span>Friends</span>
              </label>
            )}
            {filtered.map(group => (
              <label
                key={group.groupId}
                className='flex min-h-10 cursor-pointer items-start gap-2 rounded-input px-2 py-2 hover:bg-accent'
              >
                <input
                  type='checkbox'
                  className='mt-1 size-4 shrink-0 accent-primary'
                  checked={selectedIds.includes(group.groupId)}
                  disabled={
                    selectedIds.includes(group.groupId) &&
                    !removable(group.groupId)
                  }
                  onChange={() => toggle(group.groupId, group.name)}
                />
                <span className='min-w-0 break-words'>{group.name}</span>
              </label>
            ))}
            {groups === undefined ? (
              <p role='status' className='p-2 text-sm text-muted-foreground'>
                Loading groups…
              </p>
            ) : (
              filtered.length === 0 && (
                <p className='p-2 text-sm text-muted-foreground'>
                  {groups.isDone
                    ? 'No matching groups.'
                    : 'More groups are available to search.'}
                </p>
              )
            )}
          </fieldset>
          {groups && !groups.isDone && (
            <Button
              variant='ghost'
              size='sm'
              className='w-full'
              onClick={() => setCursor(groups.continueCursor)}
            >
              More matches
            </Button>
          )}
          {cursor && (
            <Button
              variant='ghost'
              size='sm'
              className='w-full'
              onClick={() => setCursor(null)}
            >
              Start over
            </Button>
          )}
        </PopoverContent>
      </Popover>
      <p className='text-sm text-muted-foreground'>
        Sharing gives access to event details, not membership.
      </p>
    </div>
  );
}
function AudienceChip({
  name,
  disabled,
  onRemove,
}: {
  name: string;
  disabled: boolean;
  onRemove: () => void;
}) {
  return (
    <span className='inline-flex max-w-full items-center gap-1 rounded-badge bg-muted py-1 pl-3 pr-1 text-sm'>
      <span className='min-w-0 break-words'>{name}</span>
      {disabled ? (
        <Check className='m-1 size-4 shrink-0' aria-hidden />
      ) : (
        <Button
          variant='ghost'
          size='icon'
          className='size-7 min-h-7 shrink-0 rounded-full'
          aria-label={`Remove ${name} audience`}
          onClick={onRemove}
        >
          <X className='size-3' aria-hidden />
        </Button>
      )}
    </span>
  );
}
