import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '@/lib/utils';
import { useCSSVariable } from 'uniwind';

type Role = 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE';

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
    bgClassName: 'bg-bg-warning-subtle border border-border shadow-raised',
    textClassName: 'text-text-warning',
  },
  MODERATOR: {
    label: 'Moderator',
    icon: 'shield',
    bgClassName: 'bg-bg-info-subtle border border-border shadow-raised',
    textClassName: 'text-text-info',
  },
  ATTENDEE: {
    label: 'Attendee',
    icon: 'person',
    bgClassName: 'bg-muted border border-border shadow-raised',
    textClassName: 'text-muted-foreground',
  },
};

interface RoleBadgeProps {
  role: string;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role as Role] ?? ROLE_CONFIG.ATTENDEE;
  const organizerColor = String(useCSSVariable('--color-text-warning') ?? '');
  const moderatorColor = String(useCSSVariable('--color-text-info') ?? '');
  const attendeeColor = String(
    useCSSVariable('--color-muted-foreground') ?? ''
  );
  const iconColor =
    role === 'ORGANIZER'
      ? organizerColor
      : role === 'MODERATOR'
        ? moderatorColor
        : attendeeColor;

  return (
    <View
      className={cn(
        'flex-row items-center gap-1 rounded-badge px-2 py-0.5',
        config.bgClassName,
        className
      )}
    >
      <Ionicons name={config.icon} size={10} color={iconColor} />
      <Text className={cn('text-xs font-semibold', config.textClassName)}>
        {config.label}
      </Text>
    </View>
  );
}
