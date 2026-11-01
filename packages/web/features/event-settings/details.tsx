'use client';

import { useRef, useState } from 'react';
import { ConfirmationDialog } from '@/components/molecules/confirmation-dialog';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { EventImageUpload } from '@/components/event-image-upload';
import { useEventSettingsDraft } from './draft';

export function EventDetailsFields() {
  const { values, setSection, busy, imageFile, setImageFile } =
    useEventSettingsDraft();
  const details = values.details;
  const [confirmRemoval, setConfirmRemoval] = useState(false);
  // EventImageUpload clears the file and then calls onFocalPointChange(null)
  // during removal. Keep that coupled callback out of an unconfirmed draft.
  const removingPreview = useRef(false);
  const removeTrigger = useRef<HTMLElement | null>(null);
  const coverRoot = useRef<HTMLDivElement>(null);
  const changeFile = (file: File | null) => {
    if (busy) return;
    if (file) {
      setImageFile(file);
      return;
    }
    removingPreview.current = true;
    if (imageFile) {
      setImageFile(null);
      return;
    }
    if (
      details.imageStorageId !== null &&
      (details.imageStorageId || details.imageUrl)
    ) {
      removeTrigger.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      setConfirmRemoval(true);
    }
  };
  return (
    <fieldset disabled={busy} className='min-w-0 space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='event-settings-title'>Title</Label>
        <Input
          id='event-settings-title'
          maxLength={200}
          required
          value={details.title}
          onChange={event =>
            setSection('details', { ...details, title: event.target.value })
          }
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='event-settings-description'>Description</Label>
        <Textarea
          id='event-settings-description'
          maxLength={5000}
          value={details.description ?? ''}
          onChange={event =>
            setSection('details', {
              ...details,
              description: event.target.value,
            })
          }
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='event-settings-location'>Location</Label>
        <Input
          id='event-settings-location'
          maxLength={500}
          value={details.location ?? ''}
          onChange={event =>
            setSection('details', { ...details, location: event.target.value })
          }
        />
      </div>
      {values.role === 'ORGANIZER' && (
        <div className='space-y-2'>
          <Label htmlFor='event-settings-visibility'>Visibility</Label>
          <select
            id='event-settings-visibility'
            className='w-full rounded-input border border-input bg-background p-2 text-foreground'
            value={details.visibility}
            onChange={event => {
              if (busy) return;
              const visibility = event.target
                .value as typeof details.visibility;
              setSection('details', { ...details, visibility });
              setSection('audiences', {
                friendsShared: visibility === 'FRIENDS',
                groupIds:
                  values.audiences.groupIds ??
                  values.audiences.groups.map(group => group.groupId),
              });
            }}
          >
            <option value='PRIVATE'>Private</option>
            <option value='FRIENDS'>Friends can discover</option>
            <option value='PUBLIC' disabled>
              Public (coming soon)
            </option>
          </select>
        </div>
      )}
      <div ref={coverRoot} tabIndex={-1} className='space-y-2'>
        <Label>Cover image</Label>
        <EventImageUpload
          disabled={busy}
          imageUrl={
            details.imageStorageId === null ? undefined : details.imageUrl
          }
          file={imageFile}
          onFileChange={changeFile}
          focalPoint={details.imageFocalPoint ?? null}
          onFocalPointChange={imageFocalPoint => {
            if (removingPreview.current) {
              removingPreview.current = false;
              return;
            }
            if (!busy) setSection('details', { ...details, imageFocalPoint });
          }}
        />
      </div>
      <Dialog
        open={confirmRemoval}
        onOpenChange={open => {
          if (busy) return;
          setConfirmRemoval(open);
          if (!open)
            requestAnimationFrame(() => {
              const target = removeTrigger.current;
              if (target?.isConnected) target.focus();
              else coverRoot.current?.focus();
            });
        }}
      >
        <ConfirmationDialog
          title='Remove cover image?'
          description='The cover will be removed when you save changes. Revert can restore it before saving.'
          confirmText='Remove cover'
          isLoading={busy}
          onConfirm={() => {
            if (busy) return;
            setSection('details', {
              ...details,
              imageStorageId: null,
              imageFocalPoint: null,
            });
          }}
        />
      </Dialog>
    </fieldset>
  );
}
