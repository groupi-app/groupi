'use client';

import { useState } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFormContext, type EventPermissions } from './form-context';
import {
  PERMISSION_LABELS,
  PERMISSION_LEVEL_LABELS,
  type EventPermissionKey,
  type PermissionLevel,
} from '@/lib/event-permissions';

type Preset = 'loose' | 'standard' | 'strict' | 'custom';

const PRESETS: Array<{
  id: Preset;
  name: string;
  description: string;
  icon: keyof typeof Icons;
}> = [
  {
    id: 'loose',
    name: 'Loose',
    description: 'For small hangouts with friends you trust.',
    icon: 'people',
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Open posting and viewing, invite control for mods.',
    icon: 'shield',
  },
  {
    id: 'strict',
    name: 'Strict',
    description: 'For larger gatherings where you need more control.',
    icon: 'lock',
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Set your own permissions manually.',
    icon: 'sliders',
  },
];

const PRESET_PERMISSIONS: Record<
  Exclude<Preset, 'custom'>,
  EventPermissions
> = {
  loose: {
    createPosts: 'EVERYONE',
    inviteMembers: 'EVERYONE',
    viewAttendeeList: 'EVERYONE',
  },
  standard: {
    createPosts: 'EVERYONE',
    inviteMembers: 'MODERATOR',
    viewAttendeeList: 'EVERYONE',
  },
  strict: {
    createPosts: 'MODERATOR',
    inviteMembers: 'ORGANIZER',
    viewAttendeeList: 'MODERATOR',
  },
};

const PERMISSION_KEYS: EventPermissionKey[] = [
  'createPosts',
  'inviteMembers',
  'viewAttendeeList',
];

const PERMISSION_LEVELS: PermissionLevel[] = [
  'EVERYONE',
  'MODERATOR',
  'ORGANIZER',
];

function detectPreset(permissions?: EventPermissions): Preset {
  if (!permissions) return 'standard';
  for (const [presetId, presetPerms] of Object.entries(PRESET_PERMISSIONS)) {
    if (
      permissions.createPosts === presetPerms.createPosts &&
      permissions.inviteMembers === presetPerms.inviteMembers &&
      permissions.viewAttendeeList === presetPerms.viewAttendeeList
    ) {
      return presetId as Preset;
    }
  }
  return 'custom';
}

interface NewEventPermissionsProps {
  onBack: () => void;
  onNext: () => void;
}

export function NewEventPermissions({
  onBack,
  onNext,
}: NewEventPermissionsProps) {
  const { formState, setFormState } = useFormContext();
  const [selectedPreset, setSelectedPreset] = useState<Preset>(
    detectPreset(formState.permissions)
  );
  const [customPermissions, setCustomPermissions] = useState<EventPermissions>(
    formState.permissions ?? PRESET_PERMISSIONS.standard
  );

  const handlePresetSelect = (preset: Preset) => {
    setSelectedPreset(preset);
    if (preset !== 'custom') {
      const perms = PRESET_PERMISSIONS[preset];
      setCustomPermissions(perms);
      setFormState({ ...formState, permissions: perms });
    } else {
      setFormState({ ...formState, permissions: customPermissions });
    }
  };

  const handleCustomChange = (
    key: EventPermissionKey,
    value: PermissionLevel
  ) => {
    const updated = { ...customPermissions, [key]: value };
    setCustomPermissions(updated);
    setFormState({ ...formState, permissions: updated });
    setSelectedPreset('custom');
  };

  const handleNext = () => {
    if (!formState.permissions) {
      setFormState({
        ...formState,
        permissions: PRESET_PERMISSIONS.standard,
      });
    }
    onNext();
  };

  return (
    <div className='my-8 flex flex-col gap-6'>
      <p className='text-muted-foreground text-sm'>
        Choose who can do what in your event. You can change these later in
        event settings.
      </p>

      <div className='grid grid-cols-2 gap-3'>
        {PRESETS.map(preset => {
          const Icon = Icons[preset.icon];
          const isSelected = selectedPreset === preset.id;
          return (
            <button
              key={preset.id}
              type='button'
              onClick={() => handlePresetSelect(preset.id)}
              className={cn(
                'flex flex-col items-start gap-2 rounded-card p-4 border-2 transition-all text-left',
                isSelected
                  ? 'border-primary bg-bg-interactive'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className='flex items-center gap-2'>
                <Icon className='size-5 text-muted-foreground' />
                <span className='font-semibold'>{preset.name}</span>
              </div>
              <p className='text-sm text-muted-foreground'>
                {preset.description}
              </p>
            </button>
          );
        })}
      </div>

      {selectedPreset === 'custom' && (
        <div className='space-y-3 rounded-card border border-border p-4'>
          {PERMISSION_KEYS.map(key => (
            <div
              key={key}
              className='flex items-center justify-between gap-4 py-1'
            >
              <span className='text-sm font-medium'>
                {PERMISSION_LABELS[key]}
              </span>
              <Select
                value={customPermissions[key] ?? 'EVERYONE'}
                onValueChange={val =>
                  handleCustomChange(key, val as PermissionLevel)
                }
              >
                <SelectTrigger className='w-[220px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERMISSION_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>
                      {PERMISSION_LEVEL_LABELS[level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}

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
        <Button type='button' onClick={handleNext}>
          Next
        </Button>
      </div>
    </div>
  );
}
