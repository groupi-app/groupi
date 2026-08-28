import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

import { Text } from '@/components/ui/text';

export function InvitePanelScrollView({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ScrollView
      keyboardShouldPersistTaps='handled'
      contentContainerClassName='gap-4 px-4 pb-10 pt-2'
    >
      {children}
    </ScrollView>
  );
}

export function InviteSectionIntro({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  const primaryColor = String(
    useCSSVariable('--color-primary') ?? 'transparent'
  );

  return (
    <View className='flex-row gap-3 rounded-card bg-primary/10 p-4'>
      <View className='size-11 items-center justify-center rounded-full bg-background'>
        <Ionicons name={icon} size={22} color={primaryColor} />
      </View>
      <View className='flex-1 gap-1'>
        <Text className='text-base font-semibold text-foreground'>{title}</Text>
        <Text className='text-sm leading-5 text-muted-foreground'>
          {description}
        </Text>
      </View>
    </View>
  );
}
