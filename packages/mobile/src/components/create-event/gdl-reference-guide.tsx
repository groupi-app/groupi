import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';

export const GDL_DAYS = [
  ['Mo', 'Mon'],
  ['Tu', 'Tue'],
  ['We', 'Wed'],
  ['Th', 'Thu'],
  ['Fr', 'Fri'],
  ['Sa', 'Sat'],
  ['Su', 'Sun'],
] as const;

export const GDL_SYMBOLS = [
  ['@', 'time'],
  ['-', 'span'],
  ['^', 'duration'],
  ['[ ]', 'list'],
  ['( )', 'range'],
  ['*', 'repeat'],
  ['+', 'combine'],
  ['" "', 'note'],
] as const;

export const GDL_EXAMPLES = [
  { expression: 'Fr@19', result: 'Friday at 7 PM' },
  { expression: '[Tu,Th]@18-20', result: 'Tue & Thu, 6–8 PM' },
  { expression: 'Tu*3@14', result: 'Next 3 Tuesdays at 2 PM' },
  { expression: 'Fr@22^3h', result: 'Friday at 10 PM for 3 hours' },
] as const;

interface GdlReferenceGuideProps {
  onClose: () => void;
  onOpenFullGuide: () => void;
  onSelectExample: (expression: string) => void;
}

export function GdlReferenceGuide({
  onClose,
  onOpenFullGuide,
  onSelectExample,
}: GdlReferenceGuideProps) {
  return (
    <View
      testID='gdl-reference-guide'
      className='mt-1 gap-4 rounded-card border border-border bg-card p-4'
    >
      <View className='flex-row items-start justify-between gap-3'>
        <View className='flex-1 gap-0.5'>
          <Text className='text-sm font-semibold text-foreground'>
            GDL quick reference
          </Text>
          <Text className='text-xs text-muted-foreground'>
            Tap an example to put it in the field.
          </Text>
        </View>
        <Pressable
          testID='gdl-reference-close'
          accessibilityRole='button'
          accessibilityLabel='Close GDL reference'
          hitSlop={8}
          onPress={onClose}
          className='size-7 items-center justify-center rounded-full active:bg-muted'
        >
          <Text className='text-xl leading-6 text-muted-foreground'>×</Text>
        </Pressable>
      </View>

      <View className='gap-2'>
        <Text className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
          Days
        </Text>
        <View className='flex-row justify-between gap-1'>
          {GDL_DAYS.map(([code, label]) => (
            <View key={code} className='items-center gap-1'>
              <View className='rounded-badge bg-primary/10 px-2 py-1'>
                <Text className='font-mono text-xs font-semibold text-primary'>
                  {code}
                </Text>
              </View>
              <Text className='text-xs text-muted-foreground'>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className='gap-2'>
        <Text className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
          Symbols
        </Text>
        <View className='flex-row flex-wrap gap-x-4 gap-y-2'>
          {GDL_SYMBOLS.map(([symbol, meaning]) => (
            <View key={symbol} className='flex-row items-center gap-1.5'>
              <Text className='font-mono text-sm font-semibold text-primary'>
                {symbol}
              </Text>
              <Text className='text-xs text-muted-foreground'>{meaning}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className='gap-2'>
        <Text className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
          Examples
        </Text>
        <View className='gap-1.5'>
          {GDL_EXAMPLES.map(example => (
            <Pressable
              key={example.expression}
              accessibilityRole='button'
              accessibilityLabel={`Use ${example.expression}: ${example.result}`}
              onPress={() => onSelectExample(example.expression)}
              className='flex-row items-center gap-3 rounded-input bg-muted/50 px-3 py-2 active:bg-muted'
            >
              <Text className='min-w-24 font-mono text-xs font-semibold text-primary'>
                {example.expression}
              </Text>
              <Text className='flex-1 text-xs text-muted-foreground'>
                {example.result}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className='gap-3'>
        <Text className='text-xs text-muted-foreground'>
          Times use 24-hour format by default, and expressions can create up to
          20 options.
        </Text>
        <View className='border-t border-border pt-3'>
          <Pressable
            testID='gdl-full-guide-link'
            accessibilityRole='link'
            accessibilityLabel='Open the full GDL guide in a web browser'
            onPress={onOpenFullGuide}
            className='self-start flex-row items-center gap-1 active:opacity-70'
          >
            <Text className='text-xs font-semibold text-primary underline'>
              Open the full GDL guide
            </Text>
            <Text className='text-sm text-primary'>↗</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
