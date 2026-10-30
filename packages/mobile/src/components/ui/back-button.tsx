import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

interface BackButtonProps {
  onPress?: () => void;
  className?: string;
}

export function BackButton({ onPress, className }: BackButtonProps) {
  const iconColor = String(
    useCSSVariable('--color-muted-foreground') ?? 'transparent'
  );

  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      accessibilityRole='button'
      accessibilityLabel='Go back'
      hitSlop={8}
      className={
        className ??
        'mr-3 h-11 w-11 items-center justify-center rounded-badge border-2 border-sticker-edge bg-muted active:bg-accent'
      }
    >
      <Ionicons name='arrow-back' size={20} color={iconColor} />
    </Pressable>
  );
}
