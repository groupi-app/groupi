import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { useCSSVariable } from 'uniwind';

import { api } from 'convex/_generated/api';
import { ThemeColorPicker } from '@/components/settings/theme-color-picker';
import { Button } from '@/components/ui/button';
import { LabeledInput } from '@/components/ui/labeled-input';
import { LabeledTextarea } from '@/components/ui/labeled-textarea';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { Text } from '@/components/ui/text';
import { colorToHex, parseColorToHsv } from '@/lib/color-utils';
import { hasThemeDraftChanges, type ThemeDraft } from '@/lib/theme-draft';
import { cn } from '@/lib/utils';
import { type MobileCustomTheme, useTheme } from '@/theme/theme-provider';
import {
  type BaseTheme,
  type ThemeTokenOverrides,
  baseThemeRegistry,
  baseThemes,
  DEFAULT_LIGHT_THEME_ID,
} from '@groupi/shared/design/themes';
import { toast } from '@groupi/shared/platform';

type EditableCategory = 'brand' | 'background' | 'text' | 'status';

interface ColorFieldDefinition {
  category: EditableCategory;
  token: string;
  label: string;
  description: string;
}

interface ColorSectionDefinition {
  id: EditableCategory;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  fields: ColorFieldDefinition[];
}

interface ActiveColorPicker {
  field: ColorFieldDefinition;
  baseColor: string;
  value: string;
}

const colorSections: ColorSectionDefinition[] = [
  {
    id: 'brand',
    title: 'Brand colors',
    icon: 'color-palette-outline',
    fields: [
      {
        category: 'brand',
        token: 'primary',
        label: 'Primary',
        description: 'Buttons, links, and selected controls',
      },
      {
        category: 'brand',
        token: 'secondary',
        label: 'Secondary',
        description: 'Supporting brand color',
      },
      {
        category: 'brand',
        token: 'accent',
        label: 'Accent',
        description: 'Highlights and decorative details',
      },
    ],
  },
  {
    id: 'background',
    title: 'Backgrounds',
    icon: 'layers-outline',
    fields: [
      {
        category: 'background',
        token: 'page',
        label: 'Page',
        description: 'Main app background',
      },
      {
        category: 'background',
        token: 'surface',
        label: 'Surface',
        description: 'Cards and panels',
      },
      {
        category: 'background',
        token: 'elevated',
        label: 'Elevated',
        description: 'Menus and raised surfaces',
      },
      {
        category: 'background',
        token: 'sunken',
        label: 'Sunken',
        description: 'Subtle recessed areas',
      },
    ],
  },
  {
    id: 'text',
    title: 'Text',
    icon: 'text-outline',
    fields: [
      {
        category: 'text',
        token: 'primary',
        label: 'Primary',
        description: 'Main text and content',
      },
      {
        category: 'text',
        token: 'secondary',
        label: 'Secondary',
        description: 'Supporting text',
      },
      {
        category: 'text',
        token: 'heading',
        label: 'Heading',
        description: 'Large titles and headings',
      },
      {
        category: 'text',
        token: 'muted',
        label: 'Muted',
        description: 'Hints and less prominent labels',
      },
    ],
  },
  {
    id: 'status',
    title: 'Status colors',
    icon: 'pulse-outline',
    fields: [
      {
        category: 'status',
        token: 'success',
        label: 'Success',
        description: 'Successful and available states',
      },
      {
        category: 'status',
        token: 'warning',
        label: 'Warning',
        description: 'Caution and maybe states',
      },
      {
        category: 'status',
        token: 'error',
        label: 'Error',
        description: 'Errors and destructive actions',
      },
      {
        category: 'status',
        token: 'info',
        label: 'Info',
        description: 'Informational states',
      },
    ],
  },
];

function getBaseColor(
  theme: BaseTheme,
  category: EditableCategory,
  token: string
) {
  if (category === 'status') {
    const statusColors: Record<string, string> = {
      success: theme.tokens.background.success,
      warning: theme.tokens.background.warning,
      error: theme.tokens.background.error,
      info: theme.tokens.background.info,
    };
    return statusColors[token] ?? theme.preview.primary;
  }

  const categoryTokens = theme.tokens[category] as unknown as Record<
    string,
    string
  >;
  return categoryTokens[token] ?? theme.preview.primary;
}

function getOverride(
  overrides: ThemeTokenOverrides,
  category: EditableCategory,
  token: string
) {
  return (overrides[category] as Record<string, string> | undefined)?.[token];
}

function getEffectiveColor(
  theme: BaseTheme,
  overrides: ThemeTokenOverrides,
  category: EditableCategory,
  token: string
) {
  const override = getOverride(overrides, category, token);
  return override && parseColorToHsv(override)
    ? override
    : getBaseColor(theme, category, token);
}

function updateColorOverride(
  current: ThemeTokenOverrides,
  category: EditableCategory,
  token: string,
  value: string
): ThemeTokenOverrides {
  const nextCategory = {
    ...(current[category] as Record<string, string> | undefined),
  };
  const trimmedValue = value.trim();

  if (trimmedValue) nextCategory[token] = trimmedValue;
  else delete nextCategory[token];

  const next = { ...current } as Record<string, unknown>;
  if (Object.keys(nextCategory).length > 0) next[category] = nextCategory;
  else delete next[category];

  return next as ThemeTokenOverrides;
}

export function CustomThemeEditor({
  open,
  editingTheme,
  onClose,
}: {
  open: boolean;
  editingTheme?: MobileCustomTheme;
  onClose: () => void;
}) {
  const { setTheme } = useTheme();
  const createTheme = useMutation(api.themes.mutations.createCustomTheme);
  const updateTheme = useMutation(api.themes.mutations.updateCustomTheme);
  const mutedColor = String(useCSSVariable('--color-muted-foreground'));
  const primaryColor = String(useCSSVariable('--color-primary'));
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseThemeId, setBaseThemeId] = useState(DEFAULT_LIGHT_THEME_ID);
  const [overrides, setOverrides] = useState<ThemeTokenOverrides>({});
  const [expandedSections, setExpandedSections] = useState<EditableCategory[]>([
    'brand',
  ]);
  const [activeColorPicker, setActiveColorPicker] =
    useState<ActiveColorPicker>();
  const [isSaving, setIsSaving] = useState(false);
  const initialDraftRef = useRef<ThemeDraft>({
    name: '',
    description: '',
    baseThemeId: DEFAULT_LIGHT_THEME_ID,
    overrides: {},
  });

  useEffect(() => {
    if (!open) return;
    const initialDraft: ThemeDraft = {
      name: editingTheme?.name ?? '',
      description: editingTheme?.description ?? '',
      baseThemeId: editingTheme?.baseThemeId ?? DEFAULT_LIGHT_THEME_ID,
      overrides: editingTheme?.tokenOverrides ?? {},
    };
    initialDraftRef.current = initialDraft;
    setName(initialDraft.name);
    setDescription(initialDraft.description);
    setBaseThemeId(initialDraft.baseThemeId);
    setOverrides(initialDraft.overrides);
    setExpandedSections(['brand']);
    setActiveColorPicker(undefined);
  }, [editingTheme, open]);

  const baseTheme =
    baseThemeRegistry[baseThemeId] ?? baseThemeRegistry[DEFAULT_LIGHT_THEME_ID];
  const invalidColors = useMemo(
    () =>
      colorSections.flatMap(section =>
        section.fields.filter(field => {
          const value = getOverride(overrides, field.category, field.token);
          return value ? !parseColorToHsv(value) : false;
        })
      ),
    [overrides]
  );
  const canSave = name.trim().length > 0 && invalidColors.length === 0;
  const hasUnsavedChanges = hasThemeDraftChanges(
    { name, description, baseThemeId, overrides },
    initialDraftRef.current
  );

  function toggleSection(section: EditableCategory) {
    setExpandedSections(current =>
      current.includes(section)
        ? current.filter(item => item !== section)
        : [...current, section]
    );
  }

  function requestClose() {
    if (!hasUnsavedChanges) {
      onClose();
      return;
    }

    showConfirmDialog({
      title: 'Discard theme changes?',
      message: 'Your unsaved theme changes will be lost.',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep Editing',
      destructive: true,
      onConfirm: onClose,
    });
  }

  async function save() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Give your theme a name');
      return;
    }
    if (invalidColors.length > 0) {
      toast.error('Fix the invalid color values before saving');
      return;
    }

    setIsSaving(true);
    try {
      if (editingTheme) {
        await updateTheme({
          themeId: editingTheme._id,
          name: trimmedName,
          description: description.trim(),
          tokenOverrides: overrides,
        });
        toast.success('Theme updated');
      } else {
        const themeId = await createTheme({
          name: trimmedName,
          description: description.trim() || undefined,
          baseThemeId: baseTheme.id,
          mode: baseTheme.mode,
          tokenOverrides: overrides,
        });
        const selected = await setTheme(baseTheme.id, themeId);
        if (!selected) toast.error('Theme created, but could not be selected');
        else toast.success('Theme created');
      }
      onClose();
    } catch {
      toast.error(
        editingTheme ? 'Unable to update theme' : 'Unable to create theme'
      );
    } finally {
      setIsSaving(false);
    }
  }

  const pageColor = getEffectiveColor(
    baseTheme,
    overrides,
    'background',
    'page'
  );
  const surfaceColor = getEffectiveColor(
    baseTheme,
    overrides,
    'background',
    'surface'
  );
  const textColor = getEffectiveColor(baseTheme, overrides, 'text', 'primary');
  const secondaryTextColor = getEffectiveColor(
    baseTheme,
    overrides,
    'text',
    'secondary'
  );
  const brandColor = getEffectiveColor(
    baseTheme,
    overrides,
    'brand',
    'primary'
  );

  return (
    <Modal
      visible={open}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={requestClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className='flex-1 bg-background'
      >
        <View className='flex-row items-center justify-between border-b border-border px-4 py-3'>
          <Pressable
            onPress={requestClose}
            disabled={isSaving}
            accessibilityRole='button'
            accessibilityLabel='Cancel theme editing'
            className='min-h-[44px] min-w-16 justify-center'
          >
            <Text className='text-base text-muted-foreground'>Cancel</Text>
          </Pressable>
          <Text className='text-lg font-semibold text-foreground'>
            {editingTheme ? 'Edit Theme' : 'New Theme'}
          </Text>
          <Pressable
            onPress={() => void save()}
            disabled={!canSave || isSaving}
            accessibilityRole='button'
            accessibilityLabel={
              editingTheme ? 'Save custom theme' : 'Create custom theme'
            }
            accessibilityState={{ disabled: !canSave || isSaving }}
            className='min-h-[44px] min-w-16 items-end justify-center'
          >
            <Text
              className={cn(
                'text-base font-semibold text-primary',
                (!canSave || isSaving) && 'opacity-40'
              )}
            >
              {isSaving
                ? editingTheme
                  ? 'Saving'
                  : 'Creating'
                : editingTheme
                  ? 'Save'
                  : 'Create'}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          className='flex-1'
          contentContainerClassName='gap-6 px-4 pb-12 pt-5'
          keyboardShouldPersistTaps='handled'
        >
          <View
            className='overflow-hidden rounded-card border border-border p-4'
            style={{ backgroundColor: pageColor }}
          >
            <View className='mb-3'>
              <Text className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                Live preview
              </Text>
            </View>
            <View
              className='gap-3 rounded-card p-4'
              style={{ backgroundColor: surfaceColor }}
            >
              <View>
                <Text
                  className='text-lg font-bold'
                  style={{ color: textColor }}
                >
                  Summer get-together
                </Text>
                <Text
                  className='mt-1 text-sm'
                  style={{ color: secondaryTextColor }}
                >
                  Saturday at 6:00 PM · 8 going
                </Text>
              </View>
              <View className='flex-row items-center justify-between'>
                <View className='flex-row gap-1.5'>
                  {(['success', 'warning', 'error'] as const).map(status => (
                    <View
                      key={status}
                      className='h-3 w-3 rounded-badge'
                      style={{
                        backgroundColor: getEffectiveColor(
                          baseTheme,
                          overrides,
                          'status',
                          status
                        ),
                      }}
                    />
                  ))}
                </View>
                <View
                  className='rounded-button px-4 py-2'
                  style={{ backgroundColor: brandColor }}
                >
                  <Text
                    className='text-sm font-semibold'
                    style={{ color: baseTheme.tokens.text.onPrimary }}
                  >
                    RSVP
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View className='gap-4'>
            <LabeledInput
              testID='custom-theme-name-input'
              label='Theme name'
              placeholder='My theme'
              value={name}
              onChangeText={setName}
              maxLength={60}
              returnKeyType='next'
            />
            <LabeledTextarea
              label='Description (optional)'
              placeholder='What makes this theme yours?'
              value={description}
              onChangeText={setDescription}
              maxLength={160}
              numberOfLines={3}
              className='min-h-24'
            />
          </View>

          <View className='gap-3'>
            <View>
              <Text className='text-base font-bold text-foreground'>
                Base theme
              </Text>
              <Text className='mt-1 text-sm text-muted-foreground'>
                Start with a complete theme, then customize only what you want.
              </Text>
            </View>

            {editingTheme ? (
              <BaseThemeChip theme={baseTheme} selected />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName='gap-2 pr-4'
              >
                {baseThemes.map(theme => (
                  <BaseThemeChip
                    key={theme.id}
                    theme={theme}
                    selected={theme.id === baseTheme.id}
                    onPress={() => setBaseThemeId(theme.id)}
                  />
                ))}
              </ScrollView>
            )}
          </View>

          <View className='gap-3'>
            <View className='flex-row items-center justify-between gap-3'>
              <View className='flex-1'>
                <Text className='text-base font-bold text-foreground'>
                  Customize colors
                </Text>
                <Text className='mt-1 text-sm text-muted-foreground'>
                  Tap a color to customize it. Reset restores the base theme.
                </Text>
              </View>
              <Button
                variant='ghost'
                size='sm'
                onPress={() => setOverrides({})}
                disabled={Object.keys(overrides).length === 0}
                accessibilityLabel='Reset custom colors'
              >
                <Ionicons
                  name='refresh-outline'
                  size={17}
                  color={primaryColor}
                />
                <Text className='text-sm font-semibold text-primary'>
                  Reset
                </Text>
              </Button>
            </View>

            <View className='overflow-hidden rounded-card border border-border bg-card'>
              {colorSections.map((section, sectionIndex) => {
                const expanded = expandedSections.includes(section.id);
                return (
                  <View
                    key={section.id}
                    className={cn(sectionIndex > 0 && 'border-t border-border')}
                  >
                    <Pressable
                      onPress={() => toggleSection(section.id)}
                      accessibilityRole='button'
                      accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} ${section.title}`}
                      className='min-h-[52px] flex-row items-center gap-3 px-4 active:bg-muted'
                    >
                      <Ionicons
                        name={section.icon}
                        size={20}
                        color={mutedColor}
                      />
                      <Text className='flex-1 font-semibold text-foreground'>
                        {section.title}
                      </Text>
                      <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={mutedColor}
                      />
                    </Pressable>

                    {expanded ? (
                      <View className='gap-4 border-t border-border bg-background px-4 py-4'>
                        {section.fields.map(field => (
                          <ColorField
                            key={`${field.category}.${field.token}`}
                            field={field}
                            baseColor={getBaseColor(
                              baseTheme,
                              field.category,
                              field.token
                            )}
                            value={
                              getOverride(
                                overrides,
                                field.category,
                                field.token
                              ) ?? ''
                            }
                            onPress={() =>
                              setActiveColorPicker({
                                field,
                                baseColor: getBaseColor(
                                  baseTheme,
                                  field.category,
                                  field.token
                                ),
                                value:
                                  getOverride(
                                    overrides,
                                    field.category,
                                    field.token
                                  ) ?? '',
                              })
                            }
                          />
                        ))}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {activeColorPicker ? (
          <ThemeColorPicker
            open
            title={`${activeColorPicker.field.label} color`}
            color={activeColorPicker.value || activeColorPicker.baseColor}
            baseColor={activeColorPicker.baseColor}
            hasOverride={Boolean(activeColorPicker.value)}
            onApply={color => {
              setOverrides(current =>
                updateColorOverride(
                  current,
                  activeColorPicker.field.category,
                  activeColorPicker.field.token,
                  color
                )
              );
              setActiveColorPicker(undefined);
            }}
            onUseBase={() => {
              setOverrides(current =>
                updateColorOverride(
                  current,
                  activeColorPicker.field.category,
                  activeColorPicker.field.token,
                  ''
                )
              );
              setActiveColorPicker(undefined);
            }}
            onClose={() => setActiveColorPicker(undefined)}
          />
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function BaseThemeChip({
  theme,
  selected,
  onPress,
}: {
  theme: BaseTheme;
  selected: boolean;
  onPress?: () => void;
}) {
  const primaryColor = String(useCSSVariable('--color-primary'));
  return (
    <Pressable
      testID={`base-theme-${theme.id}`}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole='radio'
      accessibilityLabel={theme.name}
      accessibilityState={{ checked: selected }}
      className={cn(
        'min-h-[56px] min-w-40 flex-row items-center gap-3 rounded-card border-2 bg-card px-3 py-2',
        selected ? 'border-primary' : 'border-border'
      )}
    >
      <View
        className='h-8 w-8 items-center justify-center rounded-badge border border-border'
        style={{ backgroundColor: theme.preview.background }}
      >
        <View
          className='h-4 w-4 rounded-badge'
          style={{ backgroundColor: theme.preview.primary }}
        />
      </View>
      <Text className='flex-1 text-sm font-semibold text-foreground'>
        {theme.name}
      </Text>
      {selected ? (
        <Ionicons name='checkmark-circle' size={19} color={primaryColor} />
      ) : null}
    </Pressable>
  );
}

function ColorField({
  field,
  baseColor,
  value,
  onPress,
}: {
  field: ColorFieldDefinition;
  baseColor: string;
  value: string;
  onPress: () => void;
}) {
  const mutedColor = String(useCSSVariable('--color-muted-foreground'));
  const effectiveColor = value && parseColorToHsv(value) ? value : baseColor;
  const displayColor = colorToHex(effectiveColor) ?? effectiveColor;

  return (
    <Pressable
      testID={`custom-theme-color-${field.category}-${field.token}`}
      onPress={onPress}
      accessibilityRole='button'
      accessibilityLabel={`Choose ${field.label} color`}
      accessibilityHint={field.description}
      accessibilityValue={{
        text: `${value ? 'Custom' : 'Base'}, ${displayColor}`,
      }}
      className='min-h-[64px] flex-row items-center gap-3 rounded-button px-1 active:bg-muted'
    >
      <View
        className='h-11 w-11 rounded-button border border-border'
        style={{ backgroundColor: effectiveColor }}
      />
      <View className='flex-1'>
        <Text className='font-semibold text-foreground'>{field.label}</Text>
        <Text className='text-xs text-muted-foreground'>
          {field.description}
        </Text>
        <Text className='mt-1 text-xs font-medium text-primary'>
          {value ? 'Custom' : 'Base'} · {displayColor}
        </Text>
      </View>
      <View className='h-9 w-9 items-center justify-center rounded-badge bg-muted'>
        <Ionicons name='color-palette-outline' size={18} color={mutedColor} />
      </View>
    </Pressable>
  );
}
