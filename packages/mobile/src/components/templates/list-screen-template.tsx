import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface ListScreenTemplateProps {
  title: string;
  subtitle?: string;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  controls?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ListScreenTemplate({
  title,
  subtitle,
  headerLeft,
  headerRight,
  controls,
  children,
  className,
}: ListScreenTemplateProps) {
  return (
    <SafeAreaView className={cn('flex-1 bg-background', className)}>
      <View className='border-b border-border px-4 pb-3 pt-4'>
        <View className='flex-row items-center justify-between'>
          {headerLeft ? <View>{headerLeft}</View> : null}
          <View className='flex-1'>
            <Text className='text-2xl font-bold text-foreground'>{title}</Text>
            {subtitle ? (
              <Text className='mt-0.5 text-sm text-muted-foreground'>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {headerRight ? <View>{headerRight}</View> : null}
        </View>
        {controls ? <View className='mt-3'>{controls}</View> : null}
      </View>
      {children}
    </SafeAreaView>
  );
}
