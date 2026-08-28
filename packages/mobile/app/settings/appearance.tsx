import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { useCSSVariable } from 'uniwind';

import { api } from 'convex/_generated/api';
import { LoadingState } from '@/components/molecules';
import { CustomThemeEditor } from '@/components/settings/custom-theme-editor';
import { useActionMenu } from '@/components/ui/action-menu';
import { BackButton } from '@/components/ui/back-button';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { type MobileCustomTheme, useTheme } from '@/theme/theme-provider';
import {
  type BaseTheme,
  baseThemeRegistry,
  baseThemes,
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
  onMorePress?: () => void;
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
  onMorePress,
}: ThemeOptionProps) {
  const primaryColor = String(useCSSVariable('--color-primary'));
  const mutedColor = String(useCSSVariable('--color-muted-foreground'));

  return (
    <View
      className={cn(
        'flex-row items-center overflow-hidden rounded-card border-2 bg-card',
        selected ? 'border-primary' : 'border-border',
        disabled && 'opacity-60'
      )}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole='radio'
        accessibilityLabel={name}
        accessibilityHint={description}
        accessibilityState={{ checked: selected, disabled }}
        className='min-h-[76px] flex-1 flex-row items-center gap-3 p-4 active:bg-accent/60'
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
        ) : null}
      </Pressable>
      {onMorePress ? (
        <Pressable
          onPress={onMorePress}
          disabled={disabled}
          accessibilityRole='button'
          accessibilityLabel={`Manage ${name}`}
          className='min-h-[76px] min-w-[48px] items-center justify-center active:bg-muted'
        >
          <Ionicons name='ellipsis-horizontal' size={20} color={mutedColor} />
        </Pressable>
      ) : !selected ? (
        <View className='w-4' />
      ) : null}
    </View>
  );
}

export default function AppearanceSettingsScreen() {
  const { showActionMenu } = useActionMenu();
  const deleteCustomTheme = useMutation(api.themes.mutations.deleteCustomTheme);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<MobileCustomTheme>();
  const {
    themeId,
    selectedThemeId,
    selectedThemeType,
    selectedCustomThemeId,
    customThemes,
    isLoading,
    isSaving,
    setTheme,
  } = useTheme();
  const mutedColor = String(useCSSVariable('--color-muted-foreground'));
  const primaryColor = String(useCSSVariable('--color-primary'));
  const activeThemeName =
    baseThemeRegistry[themeId]?.name ??
    customThemes.find(theme => theme._id === themeId)?.name;

  async function selectBaseTheme(theme: BaseTheme) {
    const saved = await setTheme(theme.id);
    if (!saved) toast.error('Failed to save theme preference');
  }

  async function selectCustomTheme(
    baseThemeId: string,
    customThemeId: (typeof customThemes)[number]['_id']
  ) {
    const saved = await setTheme(baseThemeId, customThemeId);
    if (!saved) toast.error('Failed to save theme preference');
  }

  function openCreateTheme() {
    setEditingTheme(undefined);
    setEditorOpen(true);
  }

  function openEditTheme(theme: MobileCustomTheme) {
    setEditingTheme(theme);
    setEditorOpen(true);
  }

  async function removeTheme(theme: MobileCustomTheme) {
    try {
      await deleteCustomTheme({ themeId: theme._id });
      toast.success('Theme deleted');
    } catch {
      toast.error('Unable to delete theme');
    }
  }

  function showThemeActions(theme: MobileCustomTheme) {
    showActionMenu({
      title: theme.name,
      options: [
        {
          label: 'Edit Theme',
          icon: 'create-outline',
          showChevron: true,
          onPress: () => openEditTheme(theme),
        },
        {
          label: 'Delete Theme',
          icon: 'trash-outline',
          destructive: true,
          onPress: () =>
            showConfirmDialog({
              title: 'Delete theme?',
              message: `“${theme.name}” will be permanently deleted.`,
              confirmLabel: 'Delete',
              destructive: true,
              onConfirm: () => void removeTheme(theme),
            }),
        },
      ],
    });
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
        <View>
          <Text className='text-lg font-bold text-foreground'>
            Choose your theme
          </Text>
          <Text className='mt-1 text-sm text-muted-foreground'>
            Your selection stays active until you choose another theme.
          </Text>
        </View>

        <ThemeSection
          title='Base themes'
          description='Choose from Groupi’s pre-designed themes.'
          themes={baseThemes}
          selectedThemeId={selectedThemeType === 'base' ? selectedThemeId : ''}
          disabled={isSaving}
          onSelect={theme => void selectBaseTheme(theme)}
        />

        <View className='gap-3'>
          <View className='flex-row items-start justify-between gap-3'>
            <View className='flex-1'>
              <Text className='text-lg font-bold text-foreground'>
                Custom themes
              </Text>
              <Text className='mt-1 text-sm text-muted-foreground'>
                Build your own look from any Groupi theme.
              </Text>
            </View>
            <Pressable
              onPress={openCreateTheme}
              accessibilityRole='button'
              accessibilityLabel='Create custom theme'
              className='min-h-[44px] flex-row items-center gap-1.5 rounded-button px-3 active:bg-muted'
            >
              <Ionicons name='add' size={18} color={primaryColor} />
              <Text className='text-sm font-semibold text-primary'>New</Text>
            </Pressable>
          </View>

          {customThemes.length > 0 ? (
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
                      void selectCustomTheme(theme.baseThemeId, theme._id)
                    }
                    onMorePress={() => showThemeActions(theme)}
                  />
                );
              })}
            </View>
          ) : (
            <Pressable
              onPress={openCreateTheme}
              accessibilityRole='button'
              accessibilityLabel='Create a custom theme'
              className='min-h-28 items-center justify-center gap-2 rounded-card border border-dashed border-border bg-card px-5 py-4 active:bg-muted'
            >
              <View className='h-10 w-10 items-center justify-center rounded-badge bg-muted'>
                <Ionicons
                  name='color-wand-outline'
                  size={21}
                  color={mutedColor}
                />
              </View>
              <Text className='font-semibold text-foreground'>
                Create a custom theme
              </Text>
              <Text className='text-center text-sm text-muted-foreground'>
                Choose a starting point and make it yours.
              </Text>
            </Pressable>
          )}
        </View>

        <View className='flex-row items-center gap-2 rounded-card bg-muted px-4 py-3'>
          <Ionicons name='sync-outline' size={18} color={mutedColor} />
          <Text className='flex-1 text-sm text-muted-foreground'>
            Your appearance is synced with Groupi web.
            {activeThemeName ? ` Active: ${activeThemeName}.` : ''}
          </Text>
        </View>
      </ScrollView>

      <CustomThemeEditor
        open={editorOpen}
        editingTheme={editingTheme}
        onClose={() => setEditorOpen(false)}
      />
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
