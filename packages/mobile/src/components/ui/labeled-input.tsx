import { View } from 'react-native';
import { Text } from './text';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface LabeledInputProps extends React.ComponentProps<typeof Input> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export function LabeledInput({
  label,
  error,
  helperText,
  containerClassName,
  className,
  ...props
}: LabeledInputProps) {
  return (
    <View className={cn('gap-1.5', containerClassName)}>
      {label ? (
        <Text variant='small' className='font-medium'>
          {label}
        </Text>
      ) : null}
      <Input
        className={cn(error && 'border-destructive', className)}
        {...props}
      />
      {error ? (
        <Text className='text-sm text-destructive'>{error}</Text>
      ) : helperText ? (
        <Text variant='muted' className='text-sm'>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}
