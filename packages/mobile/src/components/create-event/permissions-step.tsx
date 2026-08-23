import { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';
import { cn } from '@/lib/utils';

import {
  useCreateEventForm,
  type EventPermissions,
  type PermissionLevel,
} from '@/context/create-event-context';

type Preset = 'loose' | 'standard' | 'strict' | 'custom';

type EventPermissionKey = keyof EventPermissions;

const PRESETS: Array<{
  id: Preset;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
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
    description: 'Open posting, invite control for mods.',
    icon: 'shield-checkmark',
  },
  {
    id: 'strict',
    name: 'Strict',
    description: 'For larger gatherings needing more control.',
    icon: 'lock-closed',
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Set your own permissions manually.',
    icon: 'options',
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

const PERMISSION_KEYS: { key: EventPermissionKey; label: string }[] = [
  { key: 'createPosts', label: 'Create posts' },
  { key: 'inviteMembers', label: 'Invite members' },
  { key: 'viewAttendeeList', label: 'View attendee list' },
];

const PERMISSION_LEVELS: { value: PermissionLevel; label: string }[] = [
  { value: 'EVERYONE', label: 'Everyone' },
  { value: 'MODERATOR', label: 'Mods' },
  { value: 'ORGANIZER', label: 'Organizer' },
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

interface PermissionsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function PermissionsStep({ onNext, onBack }: PermissionsStepProps) {
  const { formState, updateFormState } = useCreateEventForm();
  const [selectedPreset, setSelectedPreset] = useState<Preset>(
    detectPreset(formState.permissions)
  );
  const [customPermissions, setCustomPermissions] = useState<EventPermissions>(
    formState.permissions ?? PRESET_PERMISSIONS.standard
  );

  const primaryColor = String(
    useCSSVariable('--color-primary') ?? 'transparent'
  );
  const mutedColor = String(
    useCSSVariable('--color-muted-foreground') ?? 'transparent'
  );

  function handlePresetSelect(preset: Preset) {
    setSelectedPreset(preset);
    if (preset !== 'custom') {
      const perms = PRESET_PERMISSIONS[preset];
      setCustomPermissions(perms);
      updateFormState({ permissions: perms });
    } else {
      updateFormState({ permissions: customPermissions });
    }
  }

  function handleCustomChange(key: EventPermissionKey, value: PermissionLevel) {
    const updated = { ...customPermissions, [key]: value };
    setCustomPermissions(updated);
    updateFormState({ permissions: updated });
    setSelectedPreset('custom');
  }

  function handleNext() {
    if (!formState.permissions) {
      updateFormState({ permissions: PRESET_PERMISSIONS.standard });
    }
    onNext();
  }

  return (
    <ScrollView className='flex-1 px-4' contentContainerClassName='pb-8'>
      <View className='gap-6'>
        <View className='mt-2 gap-1'>
          <Text className='text-2xl font-bold text-foreground'>
            Permissions
          </Text>
          <Text className='text-sm text-muted-foreground'>
            Choose who can do what. You can change these later.
          </Text>
        </View>

        {/* Preset grid */}
        <View className='flex-row flex-wrap gap-3'>
          {PRESETS.map(preset => {
            const isSelected = selectedPreset === preset.id;
            return (
              <Pressable
                key={preset.id}
                onPress={() => handlePresetSelect(preset.id)}
                className={cn(
                  'w-[48%] gap-2 rounded-card border-2 p-4',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card'
                )}
              >
                <View className='flex-row items-center gap-2'>
                  <Ionicons
                    name={preset.icon}
                    size={18}
                    color={isSelected ? primaryColor : mutedColor}
                  />
                  <Text
                    className={cn(
                      'font-semibold',
                      isSelected ? 'text-primary' : 'text-foreground'
                    )}
                  >
                    {preset.name}
                  </Text>
                </View>
                <Text className='text-xs text-muted-foreground'>
                  {preset.description}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Custom permissions */}
        {selectedPreset === 'custom' ? (
          <View className='gap-3 rounded-card border border-border bg-card p-4'>
            {PERMISSION_KEYS.map(({ key, label }) => (
              <View key={String(key)} className='gap-2'>
                <Text className='text-sm font-medium text-foreground'>
                  {label}
                </Text>
                <View className='flex-row gap-2'>
                  {PERMISSION_LEVELS.map(level => {
                    const isActive = customPermissions[key] === level.value;
                    return (
                      <Pressable
                        key={level.value}
                        onPress={() => handleCustomChange(key, level.value)}
                        className={cn(
                          'flex-1 items-center rounded-badge px-2 py-2',
                          isActive
                            ? 'border-2 border-primary-foreground bg-primary shadow-raised'
                            : 'bg-muted'
                        )}
                      >
                        <Text
                          className={cn(
                            'text-xs font-medium',
                            isActive
                              ? 'text-primary-foreground'
                              : 'text-muted-foreground'
                          )}
                        >
                          {level.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View className='mt-2 flex-row gap-3'>
          <Button variant='outline' onPress={onBack} className='flex-1'>
            Back
          </Button>
          <Button onPress={handleNext} className='flex-1'>
            Next
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
