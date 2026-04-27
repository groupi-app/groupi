import { View } from 'react-native';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
}

export function StepIndicator({ totalSteps, currentStep }: StepIndicatorProps) {
  return (
    <View className='flex-row items-center justify-center gap-2 py-4'>
      {Array.from({ length: totalSteps }, (_, i) => (
        <View
          key={i}
          className={cn(
            'h-2 rounded-full',
            i === currentStep
              ? 'w-6 bg-primary'
              : i < currentStep
                ? 'w-2 bg-primary/40'
                : 'w-2 bg-muted-foreground/20'
          )}
        />
      ))}
    </View>
  );
}
