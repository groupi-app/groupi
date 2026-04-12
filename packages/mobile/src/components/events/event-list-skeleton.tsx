import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

function SkeletonCard() {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className='mb-3 rounded-card bg-card p-4'
    >
      <View className='h-5 w-3/4 rounded bg-muted' />
      <View className='mt-2 h-4 w-1/2 rounded bg-muted' />
      <View className='mt-3 flex-row gap-3'>
        <View className='h-4 w-24 rounded bg-muted' />
        <View className='h-4 w-20 rounded bg-muted' />
        <View className='h-4 w-12 rounded bg-muted' />
      </View>
    </Animated.View>
  );
}

export function EventListSkeleton() {
  return (
    <View className='px-4'>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}
