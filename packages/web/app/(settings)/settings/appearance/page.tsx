'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { useGroupiTheme } from '@/providers/theme-provider';
import {
  generateCustomThemeCSS,
  saveCustomThemeCSSToStorage,
  clearCustomThemeCSSFromStorage,
} from '@/components/theme-sync';
import { SettingsPageTemplate } from '@/components/templates';
import { SettingsFormSkeleton } from '@/components/skeletons/settings-form-skeleton';
import { EmptyState, ConfirmationDialog } from '@/components/molecules';
import { Dialog } from '@/components/ui/dialog';
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from '@/components/auth/auth-wrappers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Check, Lock, Monitor, Moon, Sun } from 'lucide-react';
import {
  ThemeCard,
  CustomThemeCard,
  CreateThemeCard,
} from './components/theme-card';
import { ThemeEditorDialog } from './components/theme-editor-dialog';
import { toast } from 'sonner';
import type { ThemeTokenOverrides } from '@groupi/shared/design/themes';

// Type aliases for Convex documents
type ThemePreferences = Doc<'themePreferences'>;
type CustomTheme = Doc<'customThemes'>;

export default function AppearanceSettings() {
  return (
    <>
      <AuthLoading>
        <SettingsPageTemplate
          title='Appearance'
          isLoading
          loadingContent={<SettingsFormSkeleton />}
        >
          <div />
        </SettingsPageTemplate>
      </AuthLoading>

      <Unauthenticated>
        <SettingsPageTemplate title='Appearance'>
          <EmptyState
            icon={<Lock className='h-10 w-10' />}
            message='Authentication Required'
            description='Please sign in to access appearance settings.'
            action={
              <Link href='/sign-in'>
                <Button>Sign In</Button>
              </Link>
            }
          />
        </SettingsPageTemplate>
      </Unauthenticated>

      <Authenticated>
        <AuthenticatedAppearanceSettings />
      </Authenticated>
    </>
  );
}

function AuthenticatedAppearanceSettings() {
  const {
    currentThemeId,
    baseThemes,
    lightThemes,
    darkThemes,
    setThemeById,
    applyCustomThemeCSS,
    clearCustomThemeCSS,
  } = useGroupiTheme();

  // Convex queries - using variable assignment to break deep type inference
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - TS2589: Type instantiation may be excessively deep
  const getPrefsQuery = api.themes.queries.getThemePreferences;
  const getCustomThemesQuery = api.themes.queries.getCustomThemes;
  const prefsResult = useQuery(getPrefsQuery, {});
  const customThemesResult = useQuery(getCustomThemesQuery, {});

  const themePreferences = prefsResult as ThemePreferences | null | undefined;
  const customThemes = customThemesResult as CustomTheme[] | undefined;

  // Mutations
  const savePreference = useMutation(api.themes.mutations.saveThemePreference);
  const deleteCustomTheme = useMutation(api.themes.mutations.deleteCustomTheme);

  // Local state for pending changes
  const [isSaving, setIsSaving] = useState(false);

  // Theme editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<
    | {
        id: Id<'customThemes'>;
        name: string;
        description?: string;
        baseThemeId: string;
        mode: 'light' | 'dark';
        tokenOverrides: ThemeTokenOverrides;
      }
    | undefined
  >(undefined);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [themeToDelete, setThemeToDelete] = useState<Id<'customThemes'> | null>(
    null
  );

  // Derive current mode settings
  const themeMode = useMemo(() => {
    if (themePreferences?.useSystemPreference) return 'system';
    const currentTheme = baseThemes.find(t => t.id === currentThemeId);
    return currentTheme?.mode === 'dark' ? 'dark' : 'light';
  }, [themePreferences, currentThemeId, baseThemes]);

  // Handle theme mode change
  const handleModeChange = useCallback(
    async (mode: 'system' | 'light' | 'dark') => {
      // Determine which theme to apply
      let themeId: string;
      if (mode === 'system') {
        const isDark = window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches;
        themeId = isDark
          ? darkThemes[0]?.id || 'groupi-dark'
          : lightThemes[0]?.id || 'groupi-light';
      } else {
        themeId =
          mode === 'dark'
            ? themePreferences?.selectedThemeId &&
              darkThemes.find(t => t.id === themePreferences.selectedThemeId)
              ? themePreferences.selectedThemeId
              : darkThemes[0]?.id || 'groupi-dark'
            : themePreferences?.selectedThemeId &&
                lightThemes.find(t => t.id === themePreferences.selectedThemeId)
              ? themePreferences.selectedThemeId
              : lightThemes[0]?.id || 'groupi-light';
      }

      // Apply immediately (optimistic UI)
      setThemeById(themeId);
      clearCustomThemeCSS();
      clearCustomThemeCSSFromStorage();

      // Save to database in background
      setIsSaving(true);
      try {
        if (mode === 'system') {
          await savePreference({
            selectedThemeType: 'base',
            selectedThemeId: lightThemes[0]?.id || 'groupi-light',
            useSystemPreference: true,
            systemLightThemeId: lightThemes[0]?.id || 'groupi-light',
            systemDarkThemeId: darkThemes[0]?.id || 'groupi-dark',
          });
        } else {
          await savePreference({
            selectedThemeType: 'base',
            selectedThemeId: themeId,
            useSystemPreference: false,
            systemLightThemeId: lightThemes[0]?.id || 'groupi-light',
            systemDarkThemeId: darkThemes[0]?.id || 'groupi-dark',
          });
        }
        toast.success('Theme preference saved');
      } catch (error) {
        console.error('Failed to save theme preference:', error);
        toast.error('Failed to save theme preference');
      } finally {
        setIsSaving(false);
      }
    },
    [
      savePreference,
      setThemeById,
      clearCustomThemeCSS,
      lightThemes,
      darkThemes,
      themePreferences,
    ]
  );

  // Handle theme selection
  const handleThemeSelect = useCallback(
    async (themeId: string) => {
      const theme = baseThemes.find(t => t.id === themeId);
      if (!theme) return;

      // Apply immediately (optimistic UI)
      setThemeById(themeId);
      clearCustomThemeCSS();
      clearCustomThemeCSSFromStorage();

      // Save to database in background
      setIsSaving(true);
      try {
        await savePreference({
          selectedThemeType: 'base',
          selectedThemeId: themeId,
          useSystemPreference: false,
          systemLightThemeId:
            themePreferences?.systemLightThemeId ||
            lightThemes[0]?.id ||
            'groupi-light',
          systemDarkThemeId:
            themePreferences?.systemDarkThemeId ||
            darkThemes[0]?.id ||
            'groupi-dark',
        });
        toast.success(`Switched to ${theme.name}`);
      } catch (error) {
        console.error('Failed to save theme:', error);
        toast.error('Failed to save theme preference');
      } finally {
        setIsSaving(false);
      }
    },
    [
      savePreference,
      setThemeById,
      clearCustomThemeCSS,
      baseThemes,
      themePreferences,
      lightThemes,
      darkThemes,
    ]
  );

  // Handle system theme selection
  const handleSystemThemeChange = useCallback(
    async (type: 'light' | 'dark', themeId: string) => {
      setIsSaving(true);
      try {
        const updates = {
          selectedThemeType: 'base' as const,
          selectedThemeId:
            themePreferences?.selectedThemeId ||
            lightThemes[0]?.id ||
            'groupi-light',
          useSystemPreference: true,
          systemLightThemeId:
            type === 'light'
              ? themeId
              : themePreferences?.systemLightThemeId ||
                lightThemes[0]?.id ||
                'groupi-light',
          systemDarkThemeId:
            type === 'dark'
              ? themeId
              : themePreferences?.systemDarkThemeId ||
                darkThemes[0]?.id ||
                'groupi-dark',
        };

        await savePreference(updates);

        // Apply the theme if current system matches
        const isDark = window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches;
        if ((type === 'dark' && isDark) || (type === 'light' && !isDark)) {
          setThemeById(themeId);
        }
        toast.success('Theme preference saved');
      } catch (error) {
        console.error('Failed to save theme preference:', error);
        toast.error('Failed to save theme preference');
      } finally {
        setIsSaving(false);
      }
    },
    [savePreference, setThemeById, themePreferences, lightThemes, darkThemes]
  );

  // Handle custom theme deletion - opens confirmation dialog
  const handleDeleteCustomTheme = useCallback((themeId: Id<'customThemes'>) => {
    setThemeToDelete(themeId);
    setDeleteDialogOpen(true);
  }, []);

  // Confirm custom theme deletion
  const confirmDeleteCustomTheme = useCallback(async () => {
    if (!themeToDelete) return;

    try {
      await deleteCustomTheme({ themeId: themeToDelete });
      toast.success('Custom theme deleted');
      setDeleteDialogOpen(false);
      setThemeToDelete(null);
    } catch (error) {
      console.error('Failed to delete custom theme:', error);
      toast.error('Failed to delete custom theme');
    }
  }, [deleteCustomTheme, themeToDelete]);

  // Handle opening theme editor for editing
  const handleEditCustomTheme = useCallback((theme: CustomTheme) => {
    setEditingTheme({
      id: theme._id,
      name: theme.name,
      description: theme.description,
      baseThemeId: theme.baseThemeId,
      mode: theme.mode,
      tokenOverrides: theme.tokenOverrides as ThemeTokenOverrides,
    });
    setEditorOpen(true);
  }, []);

  // Handle opening theme editor for creating
  const handleCreateCustomTheme = useCallback(() => {
    setEditingTheme(undefined);
    setEditorOpen(true);
  }, []);

  // Handle custom theme selection
  const handleCustomThemeSelect = useCallback(
    async (themeId: Id<'customThemes'>) => {
      const theme = customThemes?.find(t => t._id === themeId);
      if (!theme) return;

      // Apply the theme immediately (optimistic UI)
      setThemeById(theme.baseThemeId);

      // Apply custom CSS overrides immediately
      const css = generateCustomThemeCSS(
        theme.baseThemeId,
        theme.tokenOverrides as ThemeTokenOverrides
      );
      if (css) {
        applyCustomThemeCSS(css);
        // Persist to localStorage for instant load on refresh
        saveCustomThemeCSSToStorage(css);
      } else {
        clearCustomThemeCSS();
        clearCustomThemeCSSFromStorage();
      }

      // Save preference to database in background
      setIsSaving(true);
      try {
        await savePreference({
          selectedThemeType: 'custom',
          selectedThemeId: theme.baseThemeId,
          selectedCustomThemeId: themeId,
          useSystemPreference: false,
          systemLightThemeId:
            themePreferences?.systemLightThemeId ||
            lightThemes[0]?.id ||
            'groupi-light',
          systemDarkThemeId:
            themePreferences?.systemDarkThemeId ||
            darkThemes[0]?.id ||
            'groupi-dark',
        });
        toast.success(`Switched to ${theme.name}`);
      } catch (error) {
        console.error('Failed to save theme:', error);
        toast.error('Failed to save theme preference');
      } finally {
        setIsSaving(false);
      }
    },
    [
      customThemes,
      savePreference,
      setThemeById,
      applyCustomThemeCSS,
      clearCustomThemeCSS,
      themePreferences,
      lightThemes,
      darkThemes,
    ]
  );

  // Loading state
  if (themePreferences === undefined || customThemes === undefined) {
    return (
      <SettingsPageTemplate
        title='Appearance'
        description='Customize how Groupi looks.'
        isLoading
        loadingContent={<SettingsFormSkeleton />}
      >
        <div />
      </SettingsPageTemplate>
    );
  }

  return (
    <SettingsPageTemplate
      title='Appearance'
      description='Customize how Groupi looks.'
    >
      <div className='space-y-8'>
        {/* Theme Mode Section */}
        <section className='space-y-4'>
          <h3 className='text-lg font-semibold text-foreground'>Theme Mode</h3>
          <div className='grid gap-3'>
            <ThemeModeOption
              mode='system'
              currentMode={themeMode}
              onSelect={() => handleModeChange('system')}
              icon={<Monitor className='h-5 w-5' />}
              title='Use system preference'
              description='Automatically switch between light and dark themes'
              disabled={isSaving}
            />
            <ThemeModeOption
              mode='light'
              currentMode={themeMode}
              onSelect={() => handleModeChange('light')}
              icon={<Sun className='h-5 w-5' />}
              title='Always light'
              description='Use light theme regardless of system settings'
              disabled={isSaving}
            />
            <ThemeModeOption
              mode='dark'
              currentMode={themeMode}
              onSelect={() => handleModeChange('dark')}
              icon={<Moon className='h-5 w-5' />}
              title='Always dark'
              description='Use dark theme regardless of system settings'
              disabled={isSaving}
            />
          </div>
        </section>

        {/* System Theme Selectors (only show when using system preference) */}
        {themeMode === 'system' && (
          <section className='space-y-4 p-4 rounded-card bg-bg-surface border border-border'>
            <h4 className='text-sm font-medium text-foreground'>
              System Theme Selection
            </h4>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label
                  htmlFor='light-theme'
                  className='text-sm text-muted-foreground'
                >
                  Light mode theme
                </Label>
                <Select
                  value={
                    themePreferences?.systemLightThemeId || lightThemes[0]?.id
                  }
                  onValueChange={value =>
                    handleSystemThemeChange('light', value)
                  }
                  disabled={isSaving}
                >
                  <SelectTrigger id='light-theme'>
                    <SelectValue placeholder='Select light theme' />
                  </SelectTrigger>
                  <SelectContent>
                    {lightThemes.map(theme => (
                      <SelectItem key={theme.id} value={theme.id}>
                        {theme.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label
                  htmlFor='dark-theme'
                  className='text-sm text-muted-foreground'
                >
                  Dark mode theme
                </Label>
                <Select
                  value={
                    themePreferences?.systemDarkThemeId || darkThemes[0]?.id
                  }
                  onValueChange={value =>
                    handleSystemThemeChange('dark', value)
                  }
                  disabled={isSaving}
                >
                  <SelectTrigger id='dark-theme'>
                    <SelectValue placeholder='Select dark theme' />
                  </SelectTrigger>
                  <SelectContent>
                    {darkThemes.map(theme => (
                      <SelectItem key={theme.id} value={theme.id}>
                        {theme.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
        )}

        {/* Base Themes Section */}
        <section className='space-y-4'>
          <h3 className='text-lg font-semibold text-foreground'>Base Themes</h3>
          <p className='text-sm text-muted-foreground'>
            Choose from our pre-designed themes.
          </p>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {baseThemes.map(theme => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isSelected={
                  currentThemeId === theme.id &&
                  !themePreferences?.useSystemPreference &&
                  themePreferences?.selectedThemeType !== 'custom'
                }
                onSelect={() => handleThemeSelect(theme.id)}
                disabled={isSaving}
              />
            ))}
          </div>
        </section>

        {/* Custom Themes Section */}
        <section className='space-y-4'>
          <h3 className='text-lg font-semibold text-foreground'>
            My Custom Themes
          </h3>
          <p className='text-sm text-muted-foreground'>
            Create and manage your personalized themes.
          </p>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {customThemes.map(theme => (
              <CustomThemeCard
                key={theme._id}
                name={theme.name}
                mode={theme.mode}
                previewColors={{
                  primary: theme.tokenOverrides?.brand?.primary,
                  background: theme.tokenOverrides?.background?.page,
                  accent: theme.tokenOverrides?.brand?.accent,
                }}
                isSelected={
                  themePreferences?.selectedThemeType === 'custom' &&
                  themePreferences?.selectedCustomThemeId === theme._id
                }
                onSelect={() => handleCustomThemeSelect(theme._id)}
                onEdit={() => handleEditCustomTheme(theme)}
                onDelete={() => handleDeleteCustomTheme(theme._id)}
                disabled={isSaving}
              />
            ))}
            <CreateThemeCard
              onClick={handleCreateCustomTheme}
              disabled={isSaving}
            />
          </div>
        </section>
      </div>

      {/* Theme Editor Dialog */}
      <ThemeEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editingTheme={editingTheme}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <ConfirmationDialog
          title='Delete Custom Theme'
          description='Are you sure you want to delete this custom theme? This action cannot be undone.'
          confirmText='Delete'
          cancelText='Cancel'
          isDestructive
          onConfirm={confirmDeleteCustomTheme}
        />
      </Dialog>
    </SettingsPageTemplate>
  );
}

// Theme mode option button component
interface ThemeModeOptionProps {
  mode: 'system' | 'light' | 'dark';
  currentMode: string;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
}

function ThemeModeOption({
  mode,
  currentMode,
  onSelect,
  icon,
  title,
  description,
  disabled = false,
}: ThemeModeOptionProps) {
  const isSelected = currentMode === mode;

  return (
    <button
      type='button'
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'flex items-center gap-3 rounded-card border-2 p-4 text-left transition-all duration-fast cursor-pointer',
        'hover:shadow-raised hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isSelected
          ? 'border-primary bg-bg-surface shadow-raised'
          : 'border-border bg-card hover:bg-bg-surface/50'
      )}
    >
      {/* Selection indicator */}
      <div
        className={cn(
          'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
          isSelected
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-muted-foreground'
        )}
      >
        {isSelected && <Check className='h-3 w-3' />}
      </div>

      {/* Icon */}
      <div className='text-muted-foreground'>{icon}</div>

      {/* Text */}
      <div className='flex-1'>
        <span className='font-medium text-foreground'>{title}</span>
        <p className='text-sm text-muted-foreground'>{description}</p>
      </div>
    </button>
  );
}
