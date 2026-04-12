import { View, Pressable, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Ionicons } from '@expo/vector-icons';

import { BackButton } from '@/components/ui/back-button';
import { useTheme } from '@/theme/theme-provider';
import { baseThemeRegistry } from '@groupi/shared/design/themes';

function ColorSwatch({ color }: { color: string }) {
  return (
    <View
      style={{
        backgroundColor: color,
        width: 18,
        height: 18,
        borderRadius: 9,
      }}
    />
  );
}

function ThemePalette({
  preview,
}: {
  preview: { primary: string; background: string; accent: string };
}) {
  return (
    <View className='flex-row gap-1.5'>
      <View
        style={{
          backgroundColor: preview.background,
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: 'rgba(128,128,128,0.2)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            backgroundColor: preview.primary,
            width: 10,
            height: 10,
            borderRadius: 5,
          }}
        />
      </View>
      <ColorSwatch color={preview.primary} />
      <ColorSwatch color={preview.accent} />
    </View>
  );
}

export default function AppearanceSettingsScreen() {
  const { themeId, setTheme } = useTheme();

  const themes = Object.entries(baseThemeRegistry).map(([id, theme]) => ({
    id,
    name: theme.name,
    description: theme.description,
    mode: theme.mode,
    preview: theme.preview,
  }));

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='flex-row items-center px-4 py-3'>
        <BackButton />
        <Text className='text-lg font-semibold text-foreground'>
          Appearance
        </Text>
      </View>

      <ScrollView
        className='flex-1 px-4'
        contentContainerClassName='pb-8 pt-2'
      >
        <View className='gap-2'>
          {themes.map(theme => {
            const isSelected = themeId === theme.id;
            return (
              <Pressable
                key={theme.id}
                onPress={() => setTheme(theme.id)}
                className={`flex-row items-center gap-3 rounded-card border-2 p-4 ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card'
                }`}
              >
                <ThemePalette preview={theme.preview} />
                <View className='flex-1'>
                  <Text
                    className={`text-base font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                    {theme.name}
                  </Text>
                  {theme.description ? (
                    <Text
                      className='mt-0.5 text-xs text-muted-foreground'
                      numberOfLines={1}
                    >
                      {theme.description}
                    </Text>
                  ) : null}
                </View>
                {isSelected ? (
                  <Ionicons
                    name='checkmark-circle'
                    size={22}
                    color='#8b00b8'
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
