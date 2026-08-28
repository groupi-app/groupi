import { View } from 'react-native';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Text } from './text';
import { cn } from '@/lib/utils';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: AvatarSize;
  showOnline?: boolean;
  isOnline?: boolean;
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

// Sticker journal aesthetic — presence dot with white border and shadow
const dotSizeClasses: Record<AvatarSize, string> = {
  xs: 'h-2 w-2 border',
  sm: 'h-2.5 w-2.5 border-[1.5px]',
  md: 'h-3 w-3 border-2',
  lg: 'h-3.5 w-3.5 border-2',
  xl: 'h-4 w-4 border-2',
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
  showOnline = false,
  isOnline = false,
  className,
}: UserAvatarProps) {
  return (
    <View className='relative'>
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
      {showOnline ? (
        <View
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-white shadow-raised',
            dotSizeClasses[size],
            isOnline ? 'bg-success' : 'bg-muted-foreground/40'
          )}
        />
      ) : null}
    </View>
  );
}
