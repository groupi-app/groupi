import type { ReactNode } from 'react';
import {
  View,
  ScrollView,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { BackButton } from '@/components/ui/back-button';
import { cn } from '@/lib/utils';

interface DetailScreenTemplateProps {
  title?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  floatingAction?: ReactNode;
  scrollable?: boolean;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  className?: string;
}

export function DetailScreenTemplate({
  title,
  headerRight,
  children,
  floatingAction,
  scrollable = true,
  onScroll,
  className,
}: DetailScreenTemplateProps) {
  return (
    <SafeAreaView className={cn('flex-1 bg-background', className)}>
      <View className='flex-row items-center justify-between border-b border-border px-4 py-3'>
        <View className='flex-row items-center flex-1'>
          <BackButton />
          {title ? (
            <Text className='text-lg font-semibold text-foreground'>
              {title}
            </Text>
          ) : null}
        </View>
        {headerRight ? <View>{headerRight}</View> : null}
      </View>

      {scrollable ? (
        <ScrollView
          className='flex-1'
          contentContainerClassName='px-4 pb-24'
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {children}
        </ScrollView>
      ) : (
        <View className='flex-1'>{children}</View>
      )}

      {floatingAction ? (
        <View className='absolute bottom-8 left-4 right-4'>
          {floatingAction}
        </View>
      ) : null}
    </SafeAreaView>
  );
}
