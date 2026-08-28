import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

import type { EventScope } from '@/stores';

const SCOPES: { key: EventScope; label: string }[] = [
  { key: 'all', label: 'All Events' },
  { key: 'mine', label: 'My Events' },
];

interface EventScopeToggleProps {
  value: EventScope;
  onChange: (scope: EventScope) => void;
}

export function EventScopeToggle({ value, onChange }: EventScopeToggleProps) {
  return (
    <View
      className='flex-row rounded-button bg-muted p-1'
      accessibilityRole='radiogroup'
      accessibilityLabel='Event ownership filter'
    >
      {SCOPES.map(scope => {
        const isSelected = value === scope.key;

        return (
          <Pressable
            key={scope.key}
            onPress={() => onChange(scope.key)}
            accessibilityRole='radio'
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={scope.label}
            className={cn(
              'items-center justify-center rounded-button px-3 py-1.5 active:scale-95',
              isSelected ? 'bg-card shadow-raised' : 'bg-transparent'
            )}
          >
            <Text
              className={cn(
                'text-xs font-semibold',
                isSelected ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {scope.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
