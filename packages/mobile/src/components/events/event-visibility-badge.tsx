import { View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';

const VISIBILITY_LABELS = {
  PUBLIC: 'Public',
  FRIENDS: 'Friends',
  PRIVATE: 'Private',
} as const;

interface EventVisibilityBadgeProps {
  visibility?: string | null;
}

export function EventVisibilityBadge({
  visibility,
}: EventVisibilityBadgeProps) {
  if (!visibility) return null;

  const label =
    VISIBILITY_LABELS[visibility as keyof typeof VISIBILITY_LABELS] ??
    'Private';

  return (
    <View className='mt-2'>
      <Badge variant='secondary' className='self-start'>
        <Text>{label}</Text>
      </Badge>
    </View>
  );
}
