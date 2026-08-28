import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

interface MutedEventIndicatorProps {
  size?: number;
}

export function MutedEventIndicator({ size = 16 }: MutedEventIndicatorProps) {
  const mutedColor = String(
    useCSSVariable('--color-muted-foreground') ?? 'transparent'
  );

  return (
    <View
      accessible
      accessibilityLabel='Event notifications muted'
      className='shrink-0'
    >
      <Ionicons
        name='notifications-off-outline'
        size={size}
        color={mutedColor}
        accessible={false}
      />
    </View>
  );
}
