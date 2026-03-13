'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useCreateEvent } from '@/hooks/mutations/use-create-event';
import { useFileUpload } from '@/hooks/convex/use-file-upload';
import { isReminderInPast } from '@/lib/datetime-helpers';
import { useFormContext } from './form-context';
import { getAddonRegistry } from './addon-registry';
import { AddonToggleCard } from './addon-toggle-card';
import { CreateWizardTemplatePicker } from './create-wizard-template-picker';

// Import addon modules so they self-register
import './addons/reminder-addon';
import './addons/questionnaire-addon';
import './addons/bring-list-addon';
import './addons/discord-addon';

interface NewEventAddonsProps {
  onBack: () => void;
}

export function NewEventAddons({ onBack }: NewEventAddonsProps) {
  const { formState, setFormState } = useFormContext();
  const router = useRouter();
  const createEvent = useCreateEvent();
  const { uploadFile } = useFileUpload();
  const [isSaving, setIsSaving] = useState(false);

  const addons = getAddonRegistry();

  const handleToggle = useCallback(
    (addonId: string, enabled: boolean) => {
      const addon = addons.find(a => a.id === addonId);
      if (!addon) return;

      const patch = enabled
        ? addon.onEnable(formState)
        : addon.onDisable(formState);
      setFormState({ ...formState, ...patch });
    },
    [addons, formState, setFormState]
  );

  const onSubmit = useCallback(async () => {
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
    } = formState;

    // Validate event date is still in the future
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

    // Collect enabled add-ons and their configs from the registry
    const enabledAddons = addons
      .filter(a => a.isEnabled(formState))
      .map(a => ({
        addonType: a.id,
        config: a.getConfigFromFormState(formState),
      }))
      .filter(
        (a): a is { addonType: string; config: Record<string, unknown> } =>
          a.config !== null
      );

    // Validate reminder offset isn't in the past (addon-specific validation)
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
  }, [formState, addons, createEvent, uploadFile, router]);

  if (!formState.title) {
    return null;
  }

  return (
    <div className='my-8 flex flex-col gap-6'>
      <p className='text-muted-foreground text-sm'>
        Enable optional features for your event. You can skip this step and
        create the event as-is.
      </p>

      <div className='flex flex-col gap-3'>
        {addons.map(addon => (
          <AddonToggleCard
            key={addon.id}
            addon={addon}
            enabled={addon.isEnabled(formState)}
            onToggle={enabled => handleToggle(addon.id, enabled)}
            formState={formState}
            setFormState={setFormState}
          />
        ))}
      </div>

      <CreateWizardTemplatePicker
        formState={formState}
        setFormState={setFormState}
      />

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
