import { View, Pressable, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface Tab {
  key: string;
  label: string;
  badge?: number;
}

interface TabBarFilterProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  className?: string;
  stretch?: boolean;
}

export function TabBarFilter({
  tabs,
  activeTab,
  onTabChange,
  className,
  stretch = false,
}: TabBarFilterProps) {
  const tabButtons = tabs.map(tab => {
    const isActive = tab.key === activeTab;
    return (
      <Pressable
        key={tab.key}
        onPress={() => onTabChange(tab.key)}
        accessibilityRole='tab'
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={tab.label}
        className={cn(
          // Sticker journal aesthetic — solid active tab with white border
          'flex-row items-center gap-1.5 rounded-badge px-4 py-2',
          stretch && 'flex-1 justify-center',
          isActive
            ? 'border-2 border-white bg-primary shadow-raised'
            : 'bg-muted'
        )}
      >
        <Text
          className={cn(
            'text-sm font-medium',
            isActive ? 'text-white' : 'text-muted-foreground'
          )}
        >
          {tab.label}
        </Text>
        {tab.badge !== undefined && tab.badge > 0 ? (
          <View
            className={cn(
              'min-w-[18px] items-center rounded-full px-1',
              isActive ? 'bg-white/25' : 'bg-primary'
            )}
          >
            <Text
              className={cn(
                'text-xs font-bold',
                isActive ? 'text-white' : 'text-primary-foreground'
              )}
            >
              {tab.badge > 99 ? '99+' : tab.badge}
            </Text>
          </View>
        ) : null}
      </Pressable>
    );
  });

  if (stretch) {
    return (
      <View
        className={cn(
          'min-h-[52px] flex-row items-center gap-2 px-4 py-2',
          className
        )}
      >
        {tabButtons}
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className={cn('h-[52px] flex-grow-0', className)}
      contentContainerClassName='min-h-[52px] flex-row items-center gap-2 px-4 py-2'
    >
      {tabButtons}
    </ScrollView>
  );
}
