import { cn } from '@/lib/utils';
import * as ProgressPrimitive from '@rn-primitives/progress';
import { Platform, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';

function Progress({
  className,
  value,
  max = 100,
  indicatorClassName,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string;
}) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const safeValue =
    value == null
      ? value
      : Math.max(0, Math.min(safeMax, Number.isFinite(value) ? value : 0));
  const percentage = ((safeValue ?? 0) / safeMax) * 100;
  return (
    <ProgressPrimitive.Root
      className={cn(
        'bg-primary/20 relative h-2 w-full overflow-hidden rounded-full',
        className
      )}
      {...props}
      value={safeValue}
      max={safeMax}
    >
      <Indicator value={percentage} className={indicatorClassName} />
    </ProgressPrimitive.Root>
  );
}

export { Progress };

const Indicator = Platform.select({
  web: WebIndicator,
  native: NativeIndicator,
  default: NullIndicator,
});

type IndicatorProps = {
  value: number | undefined | null;
  className?: string;
};

function WebIndicator({ value, className }: IndicatorProps) {
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View
      className={cn(
        'bg-primary h-full w-full flex-1 transition-all',
        className
      )}
      style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
    >
      <ProgressPrimitive.Indicator className={cn('h-full w-full', className)} />
    </View>
  );
}

function NativeIndicator({ value, className }: IndicatorProps) {
  const reducedMotion = useReducedMotion();
  const progress = useDerivedValue(() => value ?? 0);

  const indicator = useAnimatedStyle(() => {
    return {
      width: reducedMotion
        ? `${progress.value}%`
        : withSpring(`${progress.value}%`, { overshootClamping: true }),
    };
  }, [value, reducedMotion]);

  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <ProgressPrimitive.Indicator asChild>
      <Animated.View
        style={indicator}
        className={cn('bg-primary h-full', className)}
      />
    </ProgressPrimitive.Indicator>
  );
}

function NullIndicator(_props: IndicatorProps) {
  return null;
}
