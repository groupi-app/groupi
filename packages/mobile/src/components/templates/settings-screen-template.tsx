import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { BackButton } from '@/components/ui/back-button';
import { cn } from '@/lib/utils';

interface SettingsScreenTemplateProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsScreenTemplate({
  title,
  description,
  children,
  className,
}: SettingsScreenTemplateProps) {
  return (
    <SafeAreaView className={cn('flex-1 bg-background', className)}>
      <View className='flex-row items-center border-b border-border px-4 py-3'>
        <BackButton />
        <Text className='text-lg font-semibold text-foreground'>{title}</Text>
      </View>

      <ScrollView className='flex-1' contentContainerClassName='px-4 pb-8 pt-4'>
        {description ? (
          <Text className='mb-4 text-base text-muted-foreground'>
            {description}
          </Text>
        ) : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
