import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Text } from './text';
import { cn } from '@/lib/utils';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
  xl: 'h-20 w-20',
};

const textSizeClasses: Record<AvatarSize, string> = {
  xs: 'text-xs',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg',
  xl: 'text-2xl',
};

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function UserAvatar({
  src,
  name,
  size = 'md',
  className,
}: UserAvatarProps) {
  return (
    <Avatar alt={name ?? 'User'} className={cn(sizeClasses[size], className)}>
      <AvatarImage source={{ uri: src ?? undefined }} />
      <AvatarFallback>
        <Text
          className={cn(
            'font-bold text-primary-foreground',
            textSizeClasses[size]
          )}
        >
          {getInitials(name)}
        </Text>
      </AvatarFallback>
    </Avatar>
  );
}
