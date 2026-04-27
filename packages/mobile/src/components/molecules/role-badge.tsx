import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '@/lib/utils';

type Role = 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE';

// Sticker journal aesthetic — solid colored badges with white borders
const ROLE_CONFIG: Record<
  Role,
  {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    bgClassName: string;
    textClassName: string;
  }
> = {
  ORGANIZER: {
    label: 'Organizer',
    icon: 'star',
    bgClassName: 'bg-warning border-2 border-white shadow-raised',
    textClassName: 'text-white',
  },
  MODERATOR: {
    label: 'Moderator',
    icon: 'shield',
    bgClassName: 'bg-info border-2 border-white shadow-raised',
    textClassName: 'text-white',
  },
  ATTENDEE: {
    label: 'Attendee',
    icon: 'person',
    bgClassName: 'bg-muted border-2 border-white shadow-raised',
    textClassName: 'text-muted-foreground',
  },
};

interface RoleBadgeProps {
  role: string;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role as Role] ?? ROLE_CONFIG.ATTENDEE;

  return (
    <View
      className={cn(
        'flex-row items-center gap-1 rounded-badge px-2 py-0.5',
        config.bgClassName,
        className
      )}
    >
      <Ionicons
        name={config.icon}
        size={10}
        color={role === 'ATTENDEE' ? '#9ca3af' : '#ffffff'}
      />
      <Text className={cn('text-xs font-semibold', config.textClassName)}>
        {config.label}
      </Text>
    </View>
  );
}
