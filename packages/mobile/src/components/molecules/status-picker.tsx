import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '@/lib/utils';

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
    activeBg: 'bg-success border-2 border-white shadow-raised',
    activeText: 'text-white',
  },
  MAYBE: {
    icon: 'help-circle',
    label: 'Maybe',
    activeBg: 'bg-warning border-2 border-white shadow-raised',
    activeText: 'text-white',
  },
  NO: {
    icon: 'close-circle',
    label: 'Unavailable',
    activeBg: 'bg-error border-2 border-white shadow-raised',
    activeText: 'text-white',
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
  return (
    <View className={cn('flex-row gap-2', className)}>
      {(['YES', 'MAYBE', 'NO'] as const).map(status => {
        const config = STATUS_CONFIG[status];
        const isSelected = value === status;

        return (
          <Pressable
            key={status}
            onPress={() => onChange(status)}
            className={cn(
              'flex-1 flex-row items-center justify-center gap-1 rounded-button py-2',
              isSelected ? config.activeBg : 'border border-border'
            )}
          >
            <Ionicons
              name={config.icon}
              size={16}
              color={isSelected ? '#ffffff' : '#9ca3af'}
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
