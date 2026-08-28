import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

import type { EventVisibility } from '@/context/create-event-context';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/text';

const VISIBILITY_OPTIONS: Array<{
  value: EventVisibility;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}> = [
  {
    value: 'PRIVATE',
    label: 'Private',
    icon: 'lock-closed',
    description: 'Only invited members can see this event',
  },
  {
    value: 'FRIENDS',
    label: 'Friends',
    icon: 'people',
    description: 'Friends of members can discover this event',
  },
  {
    value: 'PUBLIC',
    label: 'Public',
    icon: 'globe',
    description: 'Anyone can discover and join this event',
  },
];

interface EventVisibilitySelectorProps {
  value: EventVisibility;
  onChange: (value: EventVisibility) => void;
  disabled?: boolean;
}

export function EventVisibilitySelector({
  value,
  onChange,
  disabled = false,
}: EventVisibilitySelectorProps) {
  const primaryColor = String(
    useCSSVariable('--color-primary') ?? 'transparent'
  );
  const mutedColor = String(
    useCSSVariable('--color-muted-foreground') ?? 'transparent'
  );

  return (
    <View className='gap-2' accessibilityRole='radiogroup'>
      {VISIBILITY_OPTIONS.map(option => {
        const isSelected = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            disabled={disabled}
            accessibilityRole='radio'
            accessibilityLabel={`${option.label}. ${option.description}`}
            accessibilityState={{ checked: isSelected, disabled }}
            className={cn(
              'flex-row items-center gap-3 rounded-card border p-3',
              isSelected ? 'border-primary bg-primary/5' : 'border-border',
              disabled && 'opacity-60'
            )}
          >
            <Ionicons
              name={option.icon}
              size={18}
              color={isSelected ? primaryColor : mutedColor}
            />
            <View className='flex-1'>
              <Text
                className={cn(
                  'text-sm font-medium',
                  isSelected ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {option.label}
              </Text>
              <Text className='text-xs text-muted-foreground'>
                {option.description}
              </Text>
            </View>
            {isSelected ? (
              <Ionicons
                name='checkmark-circle'
                size={20}
                color={primaryColor}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
