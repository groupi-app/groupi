'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { isReminderInPast, REMINDER_OFFSET_MS } from '@/lib/datetime-helpers';
import { type ReminderOffset } from '../form-context';
import {
  type AddonConfigProps,
  type EventCardProps,
  type ManageConfigProps,
  registerAddon,
} from '../addon-registry';
import {
  useIsAddonOptedOut,
  useToggleAddonOptOut,
} from '@/hooks/convex/use-addons';

const REMINDER_OPTIONS: Array<{
  value: ReminderOffset;
  label: string;
}> = [
  { value: '30_MINUTES', label: '30 minutes before' },
  { value: '1_HOUR', label: '1 hour before' },
  { value: '2_HOURS', label: '2 hours before' },
  { value: '4_HOURS', label: '4 hours before' },
  { value: '1_DAY', label: '1 day before' },
  { value: '2_DAYS', label: '2 days before' },
  { value: '3_DAYS', label: '3 days before' },
  { value: '1_WEEK', label: '1 week before' },
  { value: '2_WEEKS', label: '2 weeks before' },
  { value: '4_WEEKS', label: '4 weeks before' },
];

const REMINDER_OFFSET_LABELS: Record<string, string> = {
  '30_MINUTES': '30 minutes before',
  '1_HOUR': '1 hour before',
  '2_HOURS': '2 hours before',
  '4_HOURS': '4 hours before',
  '1_DAY': '1 day before',
  '2_DAYS': '2 days before',
  '3_DAYS': '3 days before',
  '1_WEEK': '1 week before',
  '2_WEEKS': '2 weeks before',
  '4_WEEKS': '4 weeks before',
};

function getEarliestEventTime(
  formState: AddonConfigProps['formState']
): string | undefined {
  if (formState.dateType === 'single' && formState.singleDateTime) {
    return formState.singleDateTime.startDateTime;
  }
  if (
    formState.dateType === 'multi' &&
    formState.multiDateTimeOptions?.length
  ) {
    return formState.multiDateTimeOptions.reduce(
      (earliest, opt) => (opt.start < earliest ? opt.start : earliest),
      formState.multiDateTimeOptions[0].start
    );
  }
  return undefined;
}

// ===== Reminder Offset Select (shared by Create + Manage) =====

function ReminderOffsetSelect({
  value,
  onChange,
  chosenDateTime,
}: {
  value: ReminderOffset;
  onChange: (value: ReminderOffset) => void;
  chosenDateTime?: string | number;
}) {
  const availableOptions = chosenDateTime
    ? REMINDER_OPTIONS.filter(
        opt => !isReminderInPast(opt.value, chosenDateTime)
      )
    : REMINDER_OPTIONS;

  const isCurrentValid = availableOptions.some(opt => opt.value === value);

  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium leading-none'>
        Remind attendees
      </label>
      <Select
        value={isCurrentValid ? value : availableOptions[0]?.value}
        onValueChange={(v: string) => onChange(v as ReminderOffset)}
      >
        <SelectTrigger data-test='addon-reminder-select'>
          <SelectValue placeholder='Select when to remind attendees' />
        </SelectTrigger>
        <SelectContent>
          {availableOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {availableOptions.length === 0 && (
        <p className='text-sm text-warning'>
          The event is too soon for any reminder to be sent.
        </p>
      )}
      {availableOptions.length > 0 && (
        <p className='text-sm text-muted-foreground'>
          Send a reminder to attendees before the event starts.
        </p>
      )}
    </div>
  );
}

// ===== Create Wizard Config =====

function ReminderCreateConfig({ formState, setFormState }: AddonConfigProps) {
  const eventTime = getEarliestEventTime(formState);
  const currentOffset =
    (formState.addonConfigs?.reminders?.reminderOffset as
      | ReminderOffset
      | undefined) ??
    formState.reminderOffset ??
    '1_DAY';

  return (
    <ReminderOffsetSelect
      value={currentOffset}
      onChange={value => {
        setFormState({
          ...formState,
          reminderOffset: value,
          addonConfigs: {
            ...formState.addonConfigs,
            reminders: { reminderOffset: value },
          },
        });
      }}
      chosenDateTime={eventTime}
    />
  );
}

// ===== Event Page Card =====

function ReminderEventCard({
  eventId,
  config,
  chosenDateTime,
}: EventCardProps) {
  const reminderOffset = (config.reminderOffset as string) ?? '';
  const { isOptedOut, isLoading, setOptimisticOptedOut } = useIsAddonOptedOut(
    eventId,
    'reminders'
  );
  const toggleOptOut = useToggleAddonOptOut();

  const offsetMs = REMINDER_OFFSET_MS[reminderOffset];
  const reminderTime =
    chosenDateTime && offsetMs ? new Date(chosenDateTime - offsetMs) : null;
  const offsetLabel = REMINDER_OFFSET_LABELS[reminderOffset] ?? reminderOffset;

  const handleToggle = async () => {
    await toggleOptOut(eventId, 'reminders', isOptedOut, setOptimisticOptedOut);
  };

  return (
    <Card className='rounded-card shadow-raised p-4 w-fit'>
      <div className='flex items-center gap-4'>
        <div className='flex items-center gap-3'>
          <div className='flex items-center justify-center size-9 rounded-card bg-bg-info-subtle text-info shrink-0'>
            <Icons.bell className='size-5' />
          </div>
          <div>
            <p className='font-medium'>Reminders</p>
            {reminderTime ? (
              <p className='text-sm text-muted-foreground'>
                {reminderTime.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                at{' '}
                {reminderTime.toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                })}{' '}
                ({offsetLabel})
              </p>
            ) : (
              <p className='text-sm text-muted-foreground'>
                Reminder will be scheduled once a date is chosen
              </p>
            )}
          </div>
        </div>
        <div className='flex items-center gap-2 shrink-0'>
          <span className='text-sm text-muted-foreground'>
            {isOptedOut ? 'Off' : 'On'}
          </span>
          <Switch
            checked={!isOptedOut}
            onCheckedChange={handleToggle}
            disabled={isLoading}
            aria-label='Toggle reminder'
          />
        </div>
      </div>
    </Card>
  );
}

// ===== Manage Page Config =====

function ReminderManageConfig({
  config,
  chosenDateTime,
  onSave,
  onDisable,
  isSaving,
}: ManageConfigProps) {
  const currentOffset = (config?.reminderOffset as ReminderOffset) ?? '1_DAY';
  const [offset, setOffset] = useState<ReminderOffset>(currentOffset);
  const enabled = config !== null;
  const [expanded, setExpanded] = useState(false);

  const handleToggle = async (checked: boolean) => {
    if (!checked) {
      setExpanded(false);
      await onDisable();
    } else {
      setExpanded(true);
      await onSave({ reminderOffset: offset });
    }
  };

  const handleOffsetChange = async (value: ReminderOffset) => {
    setOffset(value);
    if (enabled) {
      await onSave({ reminderOffset: value });
    }
  };

  return (
    <Card
      className={cn(
        'transition-all duration-normal',
        enabled && 'ring-2 ring-primary/30'
      )}
    >
      <div className='flex items-center gap-3 p-4'>
        <div className='flex size-10 shrink-0 items-center justify-center rounded-button bg-muted'>
          <Icons.bell className='size-5 text-muted-foreground' />
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-sm font-medium leading-none'>Reminders</p>
          <p className='text-sm text-muted-foreground mt-1'>
            Notify attendees before the event starts
          </p>
        </div>
        {enabled && (
          <button
            type='button'
            onClick={() => setExpanded(prev => !prev)}
            className='shrink-0 p-1 rounded-md hover:bg-muted transition-colors duration-fast'
            aria-label={expanded ? 'Collapse settings' : 'Expand settings'}
          >
            <Icons.down
              className={cn(
                'size-4 text-muted-foreground transition-transform duration-normal',
                expanded && 'rotate-180'
              )}
            />
          </button>
        )}
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={isSaving}
          data-test='addon-toggle-reminders'
        />
      </div>
      <Collapsible open={enabled && expanded}>
        <CollapsibleContent>
          <div className='px-4 pb-4 pt-0'>
            <ReminderOffsetSelect
              value={offset}
              onChange={handleOffsetChange}
              chosenDateTime={
                chosenDateTime
                  ? new Date(chosenDateTime).toISOString()
                  : undefined
              }
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ===== Registration =====

registerAddon({
  id: 'reminders',
  name: 'Reminders',
  description: 'Notify attendees before the event starts',
  iconName: 'bell',
  author: { name: 'Groupi' },

  // Create wizard
  CreateConfigComponent: ReminderCreateConfig,
  isEnabled: formState =>
    formState.addonConfigs?.reminders !== undefined ||
    formState.reminderOffset !== undefined,
  onEnable: formState => {
    const eventTime = getEarliestEventTime(formState);
    const defaultOffset: ReminderOffset = (() => {
      if (eventTime) {
        const firstValid = REMINDER_OPTIONS.find(
          opt => !isReminderInPast(opt.value, eventTime)
        );
        return (firstValid?.value ?? '1_DAY') as ReminderOffset;
      }
      return '1_DAY';
    })();

    return {
      reminderOffset: defaultOffset,
      addonConfigs: {
        ...formState.addonConfigs,
        reminders: { reminderOffset: defaultOffset },
      },
    };
  },
  onDisable: formState => {
    const { reminders: _, ...rest } = formState.addonConfigs ?? {};
    return {
      reminderOffset: undefined,
      addonConfigs: rest,
    };
  },
  getConfigFromFormState: formState => {
    if (formState.addonConfigs?.reminders) {
      return formState.addonConfigs.reminders;
    }
    // Legacy fallback
    if (formState.reminderOffset) {
      return { reminderOffset: formState.reminderOffset };
    }
    return null;
  },

  // Event page
  EventCardComponent: ReminderEventCard,

  // Manage page
  ManageConfigComponent: ReminderManageConfig,

  // Opt-out
  supportsOptOut: true,
  optOutLabel: 'Reminders',
});
