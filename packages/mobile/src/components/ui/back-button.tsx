import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface BackButtonProps {
  onPress?: () => void;
  className?: string;
}

export function BackButton({ onPress, className }: BackButtonProps) {
  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      className={
        className ??
        'mr-3 h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-muted shadow-raised'
      }
    >
      <Ionicons name='arrow-back' size={20} color='#6b7280' />
    </Pressable>
  );
}
