import { cn } from '@/lib/utils';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useReducedMotion,
  cancelAnimation,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import * as React from 'react';

const duration = 1000;

function Skeleton({ className, ...props }: React.ComponentProps<typeof View>) {
  const sv = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  React.useEffect(() => {
    if (reducedMotion) {
      sv.value = 1;
      return;
    }
    sv.value = withRepeat(withTiming(0.5, { duration }), -1, true);
    return () => cancelAnimation(sv);
  }, [sv, reducedMotion]);

  const style = useAnimatedStyle(
    () => ({
      opacity: sv.value,
    }),
    [sv]
  );
  return (
    <Animated.View
      style={style}
      className={cn('bg-secondary dark:bg-muted rounded-input', className)}
      {...props}
    />
  );
}

export { Skeleton };
