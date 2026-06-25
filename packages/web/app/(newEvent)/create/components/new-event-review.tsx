'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { StickerIcon } from '@/components/atoms';
import { useCreateEvent } from '@/hooks/mutations/use-create-event';
import { useFileUpload } from '@/hooks/convex/use-file-upload';
import { isReminderInPast } from '@/lib/datetime-helpers';
import { formatDateTimeRangeShort } from '@/lib/utils';
import { useFormContext, type EventPermissions } from './form-context';
import { getAddonRegistry } from './addon-registry';

import './addons/reminder-addon';
import './addons/questionnaire-addon';
import './addons/bring-list-addon';
import './addons/discord-addon';

function detectPresetName(permissions?: EventPermissions): string {
  if (!permissions) return 'Standard';
  const {
    createPosts: cp,
    inviteMembers: im,
    viewAttendeeList: va,
  } = permissions;
  if (cp === 'EVERYONE' && im === 'EVERYONE' && va === 'EVERYONE')
    return 'Loose';
  if (cp === 'EVERYONE' && im === 'MODERATOR' && va === 'EVERYONE')
    return 'Standard';
  if (cp === 'MODERATOR' && im === 'ORGANIZER' && va === 'MODERATOR')
    return 'Strict';
  return 'Custom';
}

const ADDON_LABELS: Record<string, string> = {
  reminders: 'Reminders',
  'bring-list': 'Bring List',
  questionnaire: 'Questionnaire',
  discord: 'Discord',
};

interface NewEventReviewProps {
  onBack: () => void;
}

export function NewEventReview({ onBack }: NewEventReviewProps) {
  const { formState } = useFormContext();
  const router = useRouter();
  const createEvent = useCreateEvent();
  const { uploadFile } = useFileUpload();
  const [isSaving, setIsSaving] = useState(false);
  const addons = getAddonRegistry();

  const {
    title,
    description,
    location,
    visibility,
    imageFile,
    imageFocalPoint,
    dateType,
    singleDateTime,
    multiDateTimeOptions,
    permissions,
  } = formState;

  const enabledAddonNames = addons
    .filter(a => a.isEnabled(formState))
    .map(a => ADDON_LABELS[a.id] ?? a.name);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const onSubmit = useCallback(async () => {
    const currentAddons = getAddonRegistry();
    if (dateType === 'single' && singleDateTime) {
      if (new Date(singleDateTime.startDateTime).getTime() <= Date.now()) {
        toast.error(
          'Event date is now in the past. Please go back and pick a future date.'
        );
        return;
      }
    }
    if (dateType === 'multi' && multiDateTimeOptions) {
      const allPast = multiDateTimeOptions.every(
        opt => new Date(opt.start).getTime() <= Date.now()
      );
      if (allPast) {
        toast.error(
          'All date options are now in the past. Please go back and pick future dates.'
        );
        return;
      }
    }

    const enabledAddons = currentAddons
      .filter(a => a.isEnabled(formState))
      .map(a => ({
        addonType: a.id,
        config: a.getConfigFromFormState(formState),
      }))
      .filter(
        (a): a is { addonType: string; config: Record<string, unknown> } =>
          a.config !== null
      );

    const reminderAddon = enabledAddons.find(a => a.addonType === 'reminders');
    if (reminderAddon) {
      const offset = reminderAddon.config.reminderOffset as string | undefined;
      if (offset) {
        const eventTime =
          dateType === 'single' && singleDateTime
            ? singleDateTime.startDateTime
            : dateType === 'multi' && multiDateTimeOptions?.length
              ? multiDateTimeOptions.reduce(
                  (earliest, opt) =>
                    opt.start < earliest ? opt.start : earliest,
                  multiDateTimeOptions[0].start
                )
              : undefined;

        if (eventTime && isReminderInPast(offset, eventTime)) {
          toast.error(
            'The selected reminder would be in the past. Please choose a shorter reminder offset or disable reminders.'
          );
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      let imageStorageId: string | undefined;
      if (imageFile) {
        const uploadResult = await uploadFile(imageFile);
        if (!uploadResult) {
          toast.error('Failed to upload image.');
          setIsSaving(false);
          return;
        }
        imageStorageId = uploadResult.storageId;
      }

      const eventData: Parameters<typeof createEvent>[0] = {
        title,
        description,
        location,
        visibility,
        imageStorageId,
        imageFocalPoint,
        addons: enabledAddons,
        permissions,
      };

      if (dateType === 'single' && singleDateTime) {
        eventData.chosenDateTime = singleDateTime.startDateTime;
        eventData.chosenEndDateTime = singleDateTime.endDateTime;
      } else if (dateType === 'multi' && multiDateTimeOptions) {
        eventData.potentialDateTimeOptions = multiDateTimeOptions;
      }

      const result = await createEvent(eventData);
      toast.success('The event was created successfully.');
      router.push(`/event/${result.eventId}`);
    } catch {
      toast.error('The event was unable to be created.');
      setIsSaving(false);
    }
  }, [formState, createEvent, uploadFile, router]);

  if (!title) {
    return null;
  }

  const dateDisplay =
    dateType === 'single' && singleDateTime
      ? formatDateTimeRangeShort(
          new Date(singleDateTime.startDateTime),
          singleDateTime.endDateTime
            ? new Date(singleDateTime.endDateTime)
            : undefined
        )
      : dateType === 'multi' && multiDateTimeOptions?.length
        ? `${multiDateTimeOptions.length} date options for voting`
        : 'Date TBD';

  return (
    <div className='my-8 flex flex-col gap-6'>
      <p className='text-muted-foreground text-sm'>
        Review your event details before creating.
      </p>

      {/* Summary card */}
      <div className='flex flex-col gap-4 rounded-card border border-border bg-card p-6'>
        {/* Image preview */}
        {imageFile && (
          <div className='relative aspect-[16/9] overflow-hidden rounded-input'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={URL.createObjectURL(imageFile)}
              alt='Cover preview'
              className='absolute inset-0 w-full h-full object-cover'
            />
          </div>
        )}

        {/* Title */}
        <div>
          <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
            Event Name
          </p>
          <p className='text-lg font-semibold'>{title}</p>
        </div>

        {/* Description */}
        {description && (
          <div>
            <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
              Description
            </p>
            <p className='text-sm'>{description}</p>
          </div>
        )}

        {/* Location */}
        {location && (
          <div className='flex items-center gap-2 text-sm'>
            <StickerIcon icon={Icons.location} size='xs' color='success' />
            <span>{location}</span>
          </div>
        )}

        {/* Visibility */}
        <div className='flex items-center gap-2 text-sm'>
          {visibility === 'FRIENDS' ? (
            <Icons.people className='size-4 text-muted-foreground' />
          ) : (
            <Icons.lock className='size-4 text-muted-foreground' />
          )}
          <span className='text-muted-foreground'>
            {visibility === 'FRIENDS'
              ? 'Friends can discover'
              : visibility === 'PUBLIC'
                ? 'Public'
                : 'Private'}
          </span>
        </div>

        {/* Date */}
        <div className='flex items-center gap-2 text-sm'>
          <StickerIcon icon={Icons.date} size='xs' color='info' />
          <span>{dateDisplay}</span>
        </div>

        {/* Permissions */}
        <div className='flex items-center gap-2 text-sm'>
          <Icons.shield className='size-4 text-muted-foreground' />
          <span className='text-muted-foreground'>
            {detectPresetName(permissions)} permissions
          </span>
        </div>

        {/* Addons */}
        {enabledAddonNames.length > 0 && (
          <div className='flex items-center gap-2 text-sm'>
            <Icons.blocks className='size-4 text-muted-foreground' />
            <span className='text-muted-foreground'>
              {enabledAddonNames.join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Checklist */}
      <div className='flex flex-col gap-2'>
        <CheckItem label='Event title' checked={!!title} />
        <CheckItem label='Description' checked={!!description} optional />
        <CheckItem label='Location' checked={!!location} optional />
        <CheckItem label='Cover image' checked={!!imageFile} optional />
        <CheckItem label='Date & time' checked />
        <CheckItem label='Permissions' checked />
        <CheckItem
          label='Add-ons'
          checked={enabledAddonNames.length > 0}
          optional
        />
      </div>

      <div className='flex justify-between mt-2'>
        <Button
          type='button'
          className='flex items-center gap-1'
          variant='secondary'
          onClick={onBack}
        >
          <span>Back</span>
          <Icons.back className='text-sm' />
        </Button>
        <Button
          data-test='create-event-button'
          type='button'
          onClick={onSubmit}
          isLoading={isSaving}
        >
          Create Event
        </Button>
      </div>
    </div>
  );
}

function CheckItem({
  label,
  checked,
  optional,
}: {
  label: string;
  checked: boolean;
  optional?: boolean;
}) {
  return (
    <div className='flex items-center gap-2'>
      {checked ? (
        <Icons.checkCircle className='size-4 text-success' />
      ) : (
        <Icons.circle className='size-4 text-muted-foreground' />
      )}
      <span
        className={`text-sm ${checked ? 'text-foreground' : 'text-muted-foreground'}`}
      >
        {label}
        {optional && !checked ? ' (optional)' : ''}
      </span>
    </div>
  );
}
