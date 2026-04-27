import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { UserAvatar } from '@/components/ui/user-avatar';

interface TypingUser {
  personId: string;
  name: string;
  image?: string | null;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

function BouncingDot({ delay }: { delay: number }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-4, { duration: 300 }),
          withTiming(0, { duration: 300 })
        ),
        -1,
        false
      )
    );
  }, [delay, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className='h-1.5 w-1.5 rounded-full bg-muted-foreground'
    />
  );
}

function formatTypingText(users: TypingUser[]): string {
  if (users.length === 0) return '';
  if (users.length === 1) return `${users[0].name} is typing`;
  if (users.length === 2)
    return `${users[0].name} and ${users[1].name} are typing`;
  if (users.length === 3)
    return `${users[0].name}, ${users[1].name}, and ${users[2].name} are typing`;
  return 'Several people are typing';
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const visibleAvatars = typingUsers.slice(0, 3);

  return (
    <View className='flex-row items-center gap-2 px-4 py-2'>
      {/* Stacked avatars */}
      <View className='flex-row'>
        {visibleAvatars.map((user, index) => (
          <View
            key={user.personId}
            style={{ marginLeft: index > 0 ? -8 : 0, zIndex: 3 - index }}
          >
            <UserAvatar src={user.image} name={user.name} size='xs' />
          </View>
        ))}
      </View>

      {/* Bouncing dots */}
      <View className='flex-row items-center gap-0.5'>
        <BouncingDot delay={0} />
        <BouncingDot delay={150} />
        <BouncingDot delay={300} />
      </View>

      {/* Text */}
      <Text className='text-xs text-muted-foreground'>
        {formatTypingText(typingUsers)}
      </Text>
    </View>
  );
}
