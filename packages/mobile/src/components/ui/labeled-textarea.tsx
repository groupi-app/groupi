import { View } from 'react-native';
import { Text } from './text';
import { Textarea } from './textarea';
import { cn } from '@/lib/utils';

interface LabeledTextareaProps extends React.ComponentProps<typeof Textarea> {
  label?: string;
  error?: string;
  maxLength?: number;
  containerClassName?: string;
}

export function LabeledTextarea({
  label,
  error,
  maxLength,
  containerClassName,
  className,
  value,
  ...props
}: LabeledTextareaProps) {
  return (
    <View className={cn('gap-1.5', containerClassName)}>
      {label ? (
        <Text variant='small' className='font-medium'>
          {label}
        </Text>
      ) : null}
      <Textarea
        className={cn(error && 'border-destructive', className)}
        value={value}
        maxLength={maxLength}
        {...props}
      />
      <View className='flex-row justify-between'>
        {error ? (
          <Text className='text-sm text-destructive'>{error}</Text>
        ) : (
          <View />
        )}
        {maxLength ? (
          <Text variant='muted' className='text-xs'>
            {(value ?? '').length}/{maxLength}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
