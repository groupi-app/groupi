import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '@/lib/utils';
import { useCSSVariable } from 'uniwind';

type VoteStatus = 'YES' | 'MAYBE' | 'NO';

const STATUS_CONFIG: Record<
  VoteStatus,
  {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    activeBg: string;
    activeText: string;
  }
> = {
  YES: {
    icon: 'checkmark-circle',
    label: 'Available',
    activeBg: 'bg-bg-success-subtle border border-border-success shadow-raised',
    activeText: 'text-text-success',
  },
  MAYBE: {
    icon: 'help-circle',
    label: 'Maybe',
    activeBg: 'bg-bg-warning-subtle border border-border shadow-raised',
    activeText: 'text-text-warning',
  },
  NO: {
    icon: 'close-circle',
    label: 'Unavailable',
    activeBg: 'bg-bg-error-subtle border border-border-error shadow-raised',
    activeText: 'text-text-error',
  },
};

interface StatusPickerProps {
  value: VoteStatus | null;
  onChange: (status: VoteStatus) => void;
  className?: string;
}

export function StatusPicker({
  value,
  onChange,
  className,
}: StatusPickerProps) {
  const statusColors: Record<VoteStatus, string> = {
    YES: String(useCSSVariable('--color-text-success') ?? ''),
    MAYBE: String(useCSSVariable('--color-text-warning') ?? ''),
    NO: String(useCSSVariable('--color-text-error') ?? ''),
  };
  const mutedColor = String(useCSSVariable('--color-muted-foreground') ?? '');

  return (
    <View
      className={cn('flex-row gap-2', className)}
      accessibilityRole='radiogroup'
    >
      {(['YES', 'MAYBE', 'NO'] as const).map(status => {
        const config = STATUS_CONFIG[status];
        const isSelected = value === status;

        return (
          <Pressable
            key={status}
            onPress={() => onChange(status)}
            accessibilityRole='radio'
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={config.label}
            className={cn(
              'min-h-11 flex-1 flex-row items-center justify-center gap-1 rounded-button py-2',
              isSelected ? config.activeBg : 'border border-border'
            )}
          >
            <Ionicons
              name={config.icon}
              size={16}
              color={isSelected ? statusColors[status] : mutedColor}
            />
            <Text
              className={cn(
                'text-sm font-medium',
                isSelected ? config.activeText : 'text-muted-foreground'
              )}
            >
              {config.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export { STATUS_CONFIG };
export type { VoteStatus };
