import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

import { LoadingState } from '@/components/molecules';
import { BackButton } from '@/components/ui/back-button';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useTheme } from '@/theme/theme-provider';
import {
  type BaseTheme,
  baseThemeRegistry,
  baseThemes,
  darkThemes,
  lightThemes,
} from '@groupi/shared/design/themes';
import { toast } from '@groupi/shared/platform';

interface ThemePreview {
  primary: string;
  background: string;
  accent: string;
}

interface ThemeOptionProps {
  name: string;
  description?: string;
  preview: ThemePreview;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}

function ThemePalette({ preview }: { preview: ThemePreview }) {
  return (
    <View className='flex-row items-center gap-1.5'>
      <View
        className='h-7 w-7 items-center justify-center rounded-card border border-border'
        style={{ backgroundColor: preview.background }}
      >
        <View
          className='h-3 w-3 rounded-badge'
          style={{ backgroundColor: preview.primary }}
        />
      </View>
      <View
        className='h-5 w-5 rounded-badge'
        style={{ backgroundColor: preview.primary }}
      />
      <View
        className='h-5 w-5 rounded-badge'
        style={{ backgroundColor: preview.accent }}
      />
    </View>
  );
}

function ThemeOption({
  name,
  description,
  preview,
  selected,
  disabled,
  onPress,
}: ThemeOptionProps) {
  const primaryColor = String(useCSSVariable('--color-primary'));

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole='radio'
      accessibilityLabel={name}
      accessibilityHint={description}
      accessibilityState={{ checked: selected, disabled }}
      className={cn(
        'flex-row items-center gap-3 rounded-card border-2 bg-card p-4 active:bg-accent/60',
        selected ? 'border-primary' : 'border-border',
        disabled && 'opacity-60'
      )}
    >
      <ThemePalette preview={preview} />
      <View className='flex-1'>
        <Text className='font-semibold text-foreground'>{name}</Text>
        {description ? (
          <Text
            className='mt-0.5 text-xs text-muted-foreground'
            numberOfLines={2}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {selected ? (
        <Ionicons name='checkmark-circle' size={22} color={primaryColor} />
      ) : (
        <View className='h-[22px] w-[22px]' />
      )}
    </Pressable>
  );
}

export default function AppearanceSettingsScreen() {
  const {
    themeId,
    selectedThemeId,
    selectedThemeType,
    selectedCustomThemeId,
    useSystemPreference,
    systemLightThemeId,
    systemDarkThemeId,
    customThemes,
    isLoading,
    isSaving,
    setTheme,
    setUseSystemPreference,
    setSystemTheme,
  } = useTheme();
  const mutedColor = String(useCSSVariable('--color-muted-foreground'));
  const activeThemeName =
    baseThemeRegistry[themeId]?.name ??
    customThemes.find(theme => theme._id === themeId)?.name;

  async function selectBaseTheme(theme: BaseTheme) {
    const saved = await setTheme(theme.id);
    if (!saved) toast.error('Failed to save theme preference');
  }

  async function changeMode(useSystem: boolean) {
    const saved = await setUseSystemPreference(useSystem);
    if (!saved) toast.error('Failed to save theme preference');
  }

  async function selectSystemTheme(mode: 'light' | 'dark', theme: BaseTheme) {
    const saved = await setSystemTheme(mode, theme.id);
    if (!saved) toast.error('Failed to save theme preference');
  }

  if (isLoading) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <SettingsHeader />
        <LoadingState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <SettingsHeader />

      <ScrollView
        className='flex-1'
        contentContainerClassName='gap-7 px-4 pb-10 pt-2'
      >
        <View className='gap-3'>
          <View>
            <Text className='text-lg font-bold text-foreground'>
              Appearance mode
            </Text>
            <Text className='mt-1 text-sm text-muted-foreground'>
              Match your device automatically or keep one theme all the time.
            </Text>
          </View>
          <View
            className='flex-row gap-2 rounded-card bg-muted p-1.5'
            accessibilityRole='radiogroup'
          >
            <ModeOption
              label='Match device'
              icon='phone-portrait-outline'
              selected={useSystemPreference}
              disabled={isSaving}
              onPress={() => void changeMode(true)}
            />
            <ModeOption
              label='One theme'
              icon='color-palette-outline'
              selected={!useSystemPreference}
              disabled={isSaving}
              onPress={() => void changeMode(false)}
            />
          </View>
        </View>

        {useSystemPreference ? (
          <View className='gap-7'>
            <ThemeSection
              title='Light appearance'
              description='Used when your device is in light mode.'
              themes={lightThemes}
              selectedThemeId={systemLightThemeId}
              disabled={isSaving}
              onSelect={theme => void selectSystemTheme('light', theme)}
            />
            <ThemeSection
              title='Dark appearance'
              description='Used when your device is in dark mode.'
              themes={darkThemes}
              selectedThemeId={systemDarkThemeId}
              disabled={isSaving}
              onSelect={theme => void selectSystemTheme('dark', theme)}
            />
          </View>
        ) : (
          <View className='gap-7'>
            <ThemeSection
              title='Groupi themes'
              description='Pick a theme to use on every device.'
              themes={baseThemes}
              selectedThemeId={
                selectedThemeType === 'base' ? selectedThemeId : ''
              }
              disabled={isSaving}
              onSelect={theme => void selectBaseTheme(theme)}
            />

            {customThemes.length > 0 ? (
              <View className='gap-3'>
                <View>
                  <Text className='text-lg font-bold text-foreground'>
                    Your themes
                  </Text>
                  <Text className='mt-1 text-sm text-muted-foreground'>
                    Custom themes you created on Groupi web.
                  </Text>
                </View>
                <View className='gap-2' accessibilityRole='radiogroup'>
                  {customThemes.map(theme => {
                    const baseTheme =
                      baseThemeRegistry[theme.baseThemeId] ??
                      baseThemeRegistry['groupi-light'];
                    return (
                      <ThemeOption
                        key={theme._id}
                        name={theme.name}
                        description={theme.description}
                        preview={{
                          primary:
                            theme.tokenOverrides.brand?.primary ??
                            baseTheme.preview.primary,
                          background:
                            theme.tokenOverrides.background?.page ??
                            baseTheme.preview.background,
                          accent:
                            theme.tokenOverrides.brand?.accent ??
                            baseTheme.preview.accent,
                        }}
                        selected={
                          selectedThemeType === 'custom' &&
                          selectedCustomThemeId === theme._id
                        }
                        disabled={isSaving}
                        onPress={() =>
                          void setTheme(theme.baseThemeId, theme._id).then(
                            saved => {
                              if (!saved) {
                                toast.error('Failed to save theme preference');
                              }
                            }
                          )
                        }
                      />
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>
        )}

        <View className='flex-row items-center gap-2 rounded-card bg-muted px-4 py-3'>
          <Ionicons name='sync-outline' size={18} color={mutedColor} />
          <Text className='flex-1 text-sm text-muted-foreground'>
            Your appearance is synced with Groupi web.
            {activeThemeName ? ` Active: ${activeThemeName}.` : ''}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsHeader() {
  return (
    <View className='flex-row items-center px-4 py-3'>
      <BackButton />
      <Text className='text-lg font-semibold text-foreground'>Appearance</Text>
    </View>
  );
}

function ModeOption({
  label,
  icon,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const foregroundColor = String(useCSSVariable('--color-foreground'));
  const mutedColor = String(useCSSVariable('--color-muted-foreground'));

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole='radio'
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled }}
      className={cn(
        'h-12 flex-1 flex-row items-center justify-center gap-2 rounded-button px-3',
        selected ? 'bg-card shadow-raised' : 'bg-transparent',
        disabled && 'opacity-60'
      )}
    >
      <Ionicons
        name={icon}
        size={18}
        color={selected ? foregroundColor : mutedColor}
      />
      <Text
        className={cn(
          'text-sm font-semibold',
          selected ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ThemeSection({
  title,
  description,
  themes,
  selectedThemeId,
  disabled,
  onSelect,
}: {
  title: string;
  description: string;
  themes: BaseTheme[];
  selectedThemeId: string;
  disabled: boolean;
  onSelect: (theme: BaseTheme) => void;
}) {
  return (
    <View className='gap-3'>
      <View>
        <Text className='text-lg font-bold text-foreground'>{title}</Text>
        <Text className='mt-1 text-sm text-muted-foreground'>
          {description}
        </Text>
      </View>
      <View className='gap-2' accessibilityRole='radiogroup'>
        {themes.map(theme => (
          <ThemeOption
            key={theme.id}
            name={theme.name}
            description={theme.description}
            preview={theme.preview}
            selected={selectedThemeId === theme.id}
            disabled={disabled}
            onPress={() => onSelect(theme)}
          />
        ))}
      </View>
    </View>
  );
}
