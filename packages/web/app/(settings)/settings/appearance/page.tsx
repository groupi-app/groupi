'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { useGroupiTheme } from '@/providers/theme-provider';
import { generateCompleteCustomThemeCSS } from '@/components/theme-sync';
import { baseThemeRegistry } from '@groupi/shared/design/themes';
import { SettingsPageTemplate } from '@/components/templates';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ConfirmationDialog } from '@/components/molecules';
import { Dialog } from '@/components/ui/dialog';
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from '@/components/auth/auth-wrappers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Check,
  ChevronDown,
  Lock,
  Palette,
  SplitSquareHorizontal,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
          description='Customize how Groupi looks.'
        >
          <AppearanceSettingsSkeleton />
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
    setBaseTheme,
    setCustomTheme,
    setSystemPreference,
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

  // Expandable system theme picker state
  const [lightThemeExpanded, setLightThemeExpanded] = useState(false);
  const [darkThemeExpanded, setDarkThemeExpanded] = useState(false);

  // Simplified mode: 'single' or 'system'
  const themeMode = useMemo(() => {
    return themePreferences?.useSystemPreference ? 'system' : 'single';
  }, [themePreferences]);

  // Handle switching between single theme and match system modes
  const handleModeChange = useCallback(
    async (mode: 'single' | 'system') => {
      const defaultLightId = lightThemes[0]?.id || 'groupi-light';
      const defaultDarkId = darkThemes[0]?.id || 'groupi-dark';

      if (mode === 'system') {
        // Switch to system preference mode
        const systemLightId =
          themePreferences?.systemLightThemeId || defaultLightId;
        const systemDarkId =
          themePreferences?.systemDarkThemeId || defaultDarkId;
        setSystemPreference(systemLightId, systemDarkId);

        setIsSaving(true);
        try {
          await savePreference({
            selectedThemeType: 'base',
            selectedThemeId: currentThemeId,
            useSystemPreference: true,
            systemLightThemeId: systemLightId,
            systemDarkThemeId: systemDarkId,
          });
          toast.success('Switched to match system preference');
        } catch (error) {
          console.error('Failed to save theme preference:', error);
          toast.error('Failed to save theme preference');
        } finally {
          setIsSaving(false);
        }
      } else {
        // Switch to single theme mode - use currently active theme
        setBaseTheme(currentThemeId);

        setIsSaving(true);
        try {
          await savePreference({
            selectedThemeType: 'base',
            selectedThemeId: currentThemeId,
            useSystemPreference: false,
            systemLightThemeId:
              themePreferences?.systemLightThemeId || defaultLightId,
            systemDarkThemeId:
              themePreferences?.systemDarkThemeId || defaultDarkId,
          });
          toast.success('Switched to single theme mode');
        } catch (error) {
          console.error('Failed to save theme preference:', error);
          toast.error('Failed to save theme preference');
        } finally {
          setIsSaving(false);
        }
      }
    },
    [
      savePreference,
      setBaseTheme,
      setSystemPreference,
      lightThemes,
      darkThemes,
      themePreferences,
      currentThemeId,
    ]
  );

  // Handle theme selection
  const handleThemeSelect = useCallback(
    async (themeId: string) => {
      const theme = baseThemes.find(t => t.id === themeId);
      if (!theme) return;

      // Apply immediately (optimistic UI) - handles DOM + localStorage
      setBaseTheme(themeId);

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
      setBaseTheme,
      baseThemes,
      themePreferences,
      lightThemes,
      darkThemes,
    ]
  );

  // Handle system theme selection - allows ANY theme for either preference
  const handleSystemThemeChange = useCallback(
    async (type: 'light' | 'dark', themeId: string) => {
      const defaultLightId = lightThemes[0]?.id || 'groupi-light';
      const defaultDarkId = darkThemes[0]?.id || 'groupi-dark';

      const newLightId =
        type === 'light'
          ? themeId
          : themePreferences?.systemLightThemeId || defaultLightId;
      const newDarkId =
        type === 'dark'
          ? themeId
          : themePreferences?.systemDarkThemeId || defaultDarkId;

      // Apply system preference with new theme mapping
      setSystemPreference(newLightId, newDarkId);

      // Collapse the card after selection
      if (type === 'light') {
        setLightThemeExpanded(false);
      } else {
        setDarkThemeExpanded(false);
      }

      setIsSaving(true);
      try {
        await savePreference({
          selectedThemeType: 'base',
          selectedThemeId: themePreferences?.selectedThemeId || defaultLightId,
          useSystemPreference: true,
          systemLightThemeId: newLightId,
          systemDarkThemeId: newDarkId,
        });

        const theme = baseThemes.find(t => t.id === themeId);
        toast.success(
          `${type === 'light' ? 'Light' : 'Dark'} system theme set to ${theme?.name || themeId}`
        );
      } catch (error) {
        console.error('Failed to save theme preference:', error);
        toast.error('Failed to save theme preference');
      } finally {
        setIsSaving(false);
      }
    },
    [
      savePreference,
      setSystemPreference,
      themePreferences,
      lightThemes,
      darkThemes,
      baseThemes,
    ]
  );

  // Get current system theme names for card headers
  const currentLightThemeName = useMemo(() => {
    const themeId =
      themePreferences?.systemLightThemeId ||
      lightThemes[0]?.id ||
      'groupi-light';
    return baseThemes.find(t => t.id === themeId)?.name || themeId;
  }, [themePreferences, baseThemes, lightThemes]);

  const currentDarkThemeName = useMemo(() => {
    const themeId =
      themePreferences?.systemDarkThemeId || darkThemes[0]?.id || 'groupi-dark';
    return baseThemes.find(t => t.id === themeId)?.name || themeId;
  }, [themePreferences, baseThemes, darkThemes]);

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

      // Get the base theme to generate complete CSS
      const baseTheme = baseThemeRegistry[theme.baseThemeId];
      if (!baseTheme) {
        toast.error('Base theme not found');
        return;
      }

      // Generate complete CSS for the custom theme
      const css = generateCompleteCustomThemeCSS(
        theme._id,
        baseTheme,
        theme.tokenOverrides as ThemeTokenOverrides
      );

      // Apply immediately (optimistic UI) - handles DOM + localStorage
      setCustomTheme(theme._id, css);

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
      setCustomTheme,
      themePreferences,
      lightThemes,
      darkThemes,
    ]
  );

  // Loading state - show actual structure with skeleton content
  if (themePreferences === undefined || customThemes === undefined) {
    return (
      <SettingsPageTemplate
        title='Appearance'
        description='Customize how Groupi looks.'
      >
        <AppearanceSettingsSkeleton />
      </SettingsPageTemplate>
    );
  }

  return (
    <SettingsPageTemplate
      title='Appearance'
      description='Customize how Groupi looks.'
    >
      <div className='space-y-8'>
        {/* Theme Mode Section - Two options: Single Theme or Match System */}
        <section className='space-y-4'>
          <h3 className='text-lg font-semibold text-foreground'>Theme Mode</h3>
          <div className='grid gap-3 sm:grid-cols-2'>
            <ThemeModeOption
              mode='single'
              currentMode={themeMode}
              onSelect={() => handleModeChange('single')}
              icon={<Palette className='h-5 w-5' />}
              title='Single Theme'
              description='Use one theme regardless of system settings'
              disabled={isSaving}
            />
            <ThemeModeOption
              mode='system'
              currentMode={themeMode}
              onSelect={() => handleModeChange('system')}
              icon={<SplitSquareHorizontal className='h-5 w-5' />}
              title='Match System'
              description='Use different themes for light and dark modes'
              disabled={isSaving}
            />
          </div>
        </section>

        {/* System Theme Pickers (only show when using system preference) */}
        {themeMode === 'system' && (
          <section className='space-y-4'>
            <h3 className='text-lg font-semibold text-foreground'>
              System Theme Mapping
            </h3>
            <p className='text-sm text-muted-foreground'>
              Choose which theme to use when your system is in light or dark
              mode.
            </p>

            {/* When system is light - expandable card */}
            <Collapsible
              open={lightThemeExpanded}
              onOpenChange={setLightThemeExpanded}
            >
              <CollapsibleTrigger asChild disabled={isSaving}>
                <button
                  type='button'
                  className={cn(
                    'w-full flex items-center justify-between gap-3 rounded-card border-2 p-4 text-left transition-all duration-fast',
                    'hover:shadow-raised hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
                    lightThemeExpanded
                      ? 'border-primary bg-bg-surface shadow-raised'
                      : 'border-border bg-card hover:bg-bg-surface/50'
                  )}
                >
                  <div className='flex-1'>
                    <span className='text-sm text-muted-foreground'>
                      When system is light
                    </span>
                    <p className='font-medium text-foreground'>
                      {currentLightThemeName}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 text-muted-foreground transition-transform duration-fast',
                      lightThemeExpanded && 'rotate-180'
                    )}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className='pt-4 space-y-6'>
                {/* Base Themes */}
                <div>
                  <h4 className='text-sm font-medium text-muted-foreground mb-3'>
                    Base Themes
                  </h4>
                  <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                    {baseThemes.map(theme => (
                      <ThemeCard
                        key={theme.id}
                        theme={theme}
                        isSelected={
                          (themePreferences?.systemLightThemeId ||
                            lightThemes[0]?.id) === theme.id
                        }
                        onSelect={() =>
                          handleSystemThemeChange('light', theme.id)
                        }
                        disabled={isSaving}
                      />
                    ))}
                  </div>
                </div>

                {/* Custom Themes */}
                {customThemes && customThemes.length > 0 && (
                  <div>
                    <h4 className='text-sm font-medium text-muted-foreground mb-3'>
                      Custom Themes
                    </h4>
                    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                      {customThemes.map(theme => (
                        <CustomThemeCard
                          key={theme._id}
                          name={theme.name}
                          mode={theme.mode}
                          baseThemeId={theme.baseThemeId}
                          tokenOverrides={
                            theme.tokenOverrides as ThemeTokenOverrides
                          }
                          isSelected={false}
                          onSelect={() => {
                            handleCustomThemeSelect(theme._id);
                            setLightThemeExpanded(false);
                          }}
                          onEdit={() => handleEditCustomTheme(theme)}
                          onDelete={() => handleDeleteCustomTheme(theme._id)}
                          disabled={isSaving}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* When system is dark - expandable card */}
            <Collapsible
              open={darkThemeExpanded}
              onOpenChange={setDarkThemeExpanded}
            >
              <CollapsibleTrigger asChild disabled={isSaving}>
                <button
                  type='button'
                  className={cn(
                    'w-full flex items-center justify-between gap-3 rounded-card border-2 p-4 text-left transition-all duration-fast',
                    'hover:shadow-raised hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
                    darkThemeExpanded
                      ? 'border-primary bg-bg-surface shadow-raised'
                      : 'border-border bg-card hover:bg-bg-surface/50'
                  )}
                >
                  <div className='flex-1'>
                    <span className='text-sm text-muted-foreground'>
                      When system is dark
                    </span>
                    <p className='font-medium text-foreground'>
                      {currentDarkThemeName}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 text-muted-foreground transition-transform duration-fast',
                      darkThemeExpanded && 'rotate-180'
                    )}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className='pt-4 space-y-6'>
                {/* Base Themes */}
                <div>
                  <h4 className='text-sm font-medium text-muted-foreground mb-3'>
                    Base Themes
                  </h4>
                  <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                    {baseThemes.map(theme => (
                      <ThemeCard
                        key={theme.id}
                        theme={theme}
                        isSelected={
                          (themePreferences?.systemDarkThemeId ||
                            darkThemes[0]?.id) === theme.id
                        }
                        onSelect={() =>
                          handleSystemThemeChange('dark', theme.id)
                        }
                        disabled={isSaving}
                      />
                    ))}
                  </div>
                </div>

                {/* Custom Themes */}
                {customThemes && customThemes.length > 0 && (
                  <div>
                    <h4 className='text-sm font-medium text-muted-foreground mb-3'>
                      Custom Themes
                    </h4>
                    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                      {customThemes.map(theme => (
                        <CustomThemeCard
                          key={theme._id}
                          name={theme.name}
                          mode={theme.mode}
                          baseThemeId={theme.baseThemeId}
                          tokenOverrides={
                            theme.tokenOverrides as ThemeTokenOverrides
                          }
                          isSelected={false}
                          onSelect={() => {
                            handleCustomThemeSelect(theme._id);
                            setDarkThemeExpanded(false);
                          }}
                          onEdit={() => handleEditCustomTheme(theme)}
                          onDelete={() => handleDeleteCustomTheme(theme._id)}
                          disabled={isSaving}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </section>
        )}

        {/* Themes Section (only show when using single theme mode) */}
        {themeMode === 'single' && (
          <section className='space-y-6'>
            <div>
              <h3 className='text-lg font-semibold text-foreground'>
                Base Themes
              </h3>
              <p className='text-sm text-muted-foreground'>
                Choose from our pre-designed themes.
              </p>
            </div>
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

            {/* Custom Themes */}
            <div>
              <h3 className='text-lg font-semibold text-foreground'>
                Custom Themes
              </h3>
              <p className='text-sm text-muted-foreground'>
                Create and manage your personalized themes.
              </p>
            </div>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              {customThemes.map(theme => (
                <CustomThemeCard
                  key={theme._id}
                  name={theme.name}
                  mode={theme.mode}
                  baseThemeId={theme.baseThemeId}
                  tokenOverrides={theme.tokenOverrides as ThemeTokenOverrides}
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
        )}
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
  mode: 'single' | 'system';
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

/**
 * ThemeModeOptionSkeleton - Skeleton for theme mode option
 * Matches ThemeModeOption: radio, icon, title, description
 */
function ThemeModeOptionSkeleton() {
  return (
    <div className='flex items-center gap-3 rounded-card border-2 border-border p-4 bg-card'>
      {/* Radio indicator */}
      <Skeleton className='size-5 rounded-full' />
      {/* Icon */}
      <Skeleton className='size-5' />
      {/* Text */}
      <div className='flex-1 space-y-1'>
        <Skeleton className='h-5 w-40' />
        <Skeleton className='h-4 w-64' />
      </div>
    </div>
  );
}

/**
 * ThemeCardSkeleton - Skeleton for theme preview card
 * Matches ThemeCard: color preview, name, mode
 */
function ThemeCardSkeleton() {
  return (
    <div className='relative flex flex-col gap-2 rounded-card border-2 border-border p-3 bg-card'>
      {/* Color preview */}
      <Skeleton className='h-16 w-full rounded-rounded' />
      {/* Theme info */}
      <div className='flex items-center justify-between'>
        <div className='space-y-1'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-3 w-16' />
        </div>
      </div>
    </div>
  );
}

/**
 * AppearanceSettingsSkeleton - Full skeleton for the appearance settings page
 * Shows actual section titles with skeleton content
 */
function AppearanceSettingsSkeleton() {
  return (
    <div className='space-y-8'>
      {/* Theme Mode Section */}
      <section className='space-y-4'>
        <h3 className='text-lg font-semibold text-foreground'>Theme Mode</h3>
        <div className='grid gap-3 sm:grid-cols-2'>
          <ThemeModeOptionSkeleton />
          <ThemeModeOptionSkeleton />
        </div>
      </section>

      {/* Base Themes Section */}
      <section className='space-y-4'>
        <h3 className='text-lg font-semibold text-foreground'>Base Themes</h3>
        <p className='text-sm text-muted-foreground'>
          Choose from our pre-designed themes.
        </p>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <ThemeCardSkeleton />
          <ThemeCardSkeleton />
          <ThemeCardSkeleton />
          <ThemeCardSkeleton />
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
          <ThemeCardSkeleton />
          <Skeleton className='aspect-[3/2] rounded-card border-2 border-dashed border-border' />
        </div>
      </section>
    </div>
  );
}
