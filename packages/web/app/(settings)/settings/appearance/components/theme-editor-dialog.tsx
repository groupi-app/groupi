'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { ColorPicker } from './color-picker';
import { ThemePreview } from './theme-preview';
import { useGroupiTheme } from '@/providers/theme-provider';
import { useMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { ThemeTokenOverrides } from '@groupi/shared/design/themes';

interface ThemeEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTheme?: {
    id: Id<'customThemes'>;
    name: string;
    description?: string;
    baseThemeId: string;
    mode: 'light' | 'dark';
    tokenOverrides: ThemeTokenOverrides;
  };
}

/**
 * Theme editor dialog for creating and editing custom themes.
 * Uses a sheet for mobile-friendly full-screen editing.
 */
export function ThemeEditorDialog({
  open,
  onOpenChange,
  editingTheme,
}: ThemeEditorDialogProps) {
  const { lightThemes, darkThemes, getBaseTheme } = useGroupiTheme();
  const isMobile = useMobile();
  const isEditing = !!editingTheme;

  // Form state
  const [name, setName] = useState(editingTheme?.name || '');
  const [description, setDescription] = useState(
    editingTheme?.description || ''
  );
  const [baseThemeId, setBaseThemeId] = useState(
    editingTheme?.baseThemeId || 'groupi-light'
  );
  const [overrides, setOverrides] = useState<ThemeTokenOverrides>(
    editingTheme?.tokenOverrides || {}
  );
  const [isSaving, setIsSaving] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(['brand']);

  // Reset form state when dialog opens or editingTheme changes
  useEffect(() => {
    if (open) {
      setName(editingTheme?.name || '');
      setDescription(editingTheme?.description || '');
      setBaseThemeId(editingTheme?.baseThemeId || 'groupi-light');
      setOverrides(editingTheme?.tokenOverrides || {});
      setOpenSections(['brand']);
    }
  }, [open, editingTheme]);

  // Ref for portal container (needed for Select inside Sheet)
  const containerRef = useRef<HTMLDivElement>(null);

  // Get base theme info
  const baseTheme = getBaseTheme(baseThemeId);
  const mode = baseTheme?.mode || 'light';
  const allThemes = useMemo(
    () => [...lightThemes, ...darkThemes],
    [lightThemes, darkThemes]
  );

  // Mutations - using variable assignment to break deep type inference
  // @ts-expect-error - TS2589: Type instantiation is excessively deep
  const createMutation = api.themes.mutations.createCustomTheme;
  const updateMutation = api.themes.mutations.updateCustomTheme;
  const createTheme = useMutation(createMutation);
  const updateTheme = useMutation(updateMutation);

  // Toggle section
  const toggleSection = useCallback((section: string) => {
    setOpenSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  }, []);

  // Update a single token override
  const updateOverride = useCallback(
    (category: keyof ThemeTokenOverrides, token: string, value: string) => {
      setOverrides(prev => ({
        ...prev,
        [category]: {
          ...(prev[category] as Record<string, string> | undefined),
          [token]: value,
        },
      }));
    },
    []
  );

  // Get current value for a token (override or base theme default)
  const getTokenValue = useCallback(
    (category: keyof ThemeTokenOverrides, token: string): string => {
      // Check overrides first
      const categoryOverrides = overrides[category] as
        | Record<string, string>
        | undefined;
      if (categoryOverrides?.[token]) {
        return categoryOverrides[token];
      }

      // Fall back to base theme token values
      if (!baseTheme) return '#000000';

      const tokens = baseTheme.tokens;

      // Map category and token to actual theme values
      if (category === 'brand') {
        const brandTokens = tokens.brand as unknown as Record<string, string>;
        if (brandTokens[token]) return brandTokens[token];
      }
      if (category === 'background') {
        const bgTokens = tokens.background as unknown as Record<string, string>;
        if (bgTokens[token]) return bgTokens[token];
      }
      if (category === 'text') {
        const textTokens = tokens.text as unknown as Record<string, string>;
        if (textTokens[token]) return textTokens[token];
      }
      if (category === 'status') {
        // Status colors map to background status colors
        const statusMap: Record<string, string> = {
          success: tokens.background.success,
          warning: tokens.background.warning,
          error: tokens.background.error,
          info: tokens.background.info,
        };
        if (statusMap[token]) return statusMap[token];
      }

      // Default fallback
      return mode === 'dark' ? '#1a1a1a' : '#ffffff';
    },
    [overrides, baseTheme, mode]
  );

  // Reset all overrides
  const handleReset = useCallback(() => {
    setOverrides({});
    toast.info('Overrides reset to base theme');
  }, []);

  // Save theme
  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      toast.error('Please enter a theme name');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && editingTheme) {
        await updateTheme({
          themeId: editingTheme.id,
          name: name.trim(),
          description: description.trim() || undefined,
          tokenOverrides: overrides,
        });
        toast.success('Theme updated');
      } else {
        await createTheme({
          name: name.trim(),
          description: description.trim() || undefined,
          baseThemeId,
          mode,
          tokenOverrides: overrides,
        });
        toast.success('Theme created');
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save theme:', error);
      toast.error('Failed to save theme');
    } finally {
      setIsSaving(false);
    }
  }, [
    name,
    description,
    baseThemeId,
    mode,
    overrides,
    isEditing,
    editingTheme,
    createTheme,
    updateTheme,
    onOpenChange,
  ]);

  // Shared form content
  const formContent = (
    <div className='space-y-6'>
      {/* Container ref for portal rendering (Select/Popover inside Sheet/Drawer) */}
      <div ref={containerRef} />

      {/* Theme Name */}
      <div className='space-y-2'>
        <Label htmlFor='theme-name'>Theme Name</Label>
        <Input
          id='theme-name'
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder='My Custom Theme'
        />
      </div>

      {/* Description */}
      <div className='space-y-2'>
        <Label htmlFor='theme-description'>Description (optional)</Label>
        <Input
          id='theme-description'
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder='A brief description of your theme'
        />
      </div>

      {/* Base Theme Selection (only for new themes) */}
      {!isEditing && (
        <div className='space-y-2'>
          <Label htmlFor='base-theme'>Base Theme</Label>
          <Select value={baseThemeId} onValueChange={setBaseThemeId}>
            <SelectTrigger id='base-theme' className='cursor-pointer'>
              <SelectValue placeholder='Select base theme' />
            </SelectTrigger>
            <SelectContent container={containerRef.current}>
              {allThemes.map(theme => (
                <SelectItem
                  key={theme.id}
                  value={theme.id}
                  className='cursor-pointer'
                >
                  {theme.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className='text-xs text-muted-foreground'>
            Your custom theme will inherit all colors from this base theme.
          </p>
        </div>
      )}

      {/* Color Customization */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-semibold'>Color Customization</h3>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleReset}
            className='h-8 text-xs'
          >
            <RotateCcw className='h-3 w-3 mr-1' />
            Reset
          </Button>
        </div>

        <div className='space-y-2'>
          {/* Brand Colors */}
          <ColorSection
            title='Brand Colors'
            isOpen={openSections.includes('brand')}
            onToggle={() => toggleSection('brand')}
          >
            <ColorPicker
              label='Primary'
              description='Main brand color for buttons and links'
              value={getTokenValue('brand', 'primary')}
              onChange={v => updateOverride('brand', 'primary', v)}
              container={containerRef.current}
            />
            <ColorPicker
              label='Secondary'
              description='Secondary brand color'
              value={getTokenValue('brand', 'secondary')}
              onChange={v => updateOverride('brand', 'secondary', v)}
              container={containerRef.current}
            />
            <ColorPicker
              label='Accent'
              description='Accent color for highlights'
              value={getTokenValue('brand', 'accent')}
              onChange={v => updateOverride('brand', 'accent', v)}
              container={containerRef.current}
            />
          </ColorSection>

          {/* Background Colors */}
          <ColorSection
            title='Background Colors'
            isOpen={openSections.includes('background')}
            onToggle={() => toggleSection('background')}
          >
            <ColorPicker
              label='Page'
              description='Main page background'
              value={getTokenValue('background', 'page')}
              onChange={v => updateOverride('background', 'page', v)}
              container={containerRef.current}
            />
            <ColorPicker
              label='Surface'
              description='Card and container backgrounds'
              value={getTokenValue('background', 'surface')}
              onChange={v => updateOverride('background', 'surface', v)}
              container={containerRef.current}
            />
            <ColorPicker
              label='Elevated'
              description='Elevated surfaces like popovers'
              value={getTokenValue('background', 'elevated')}
              onChange={v => updateOverride('background', 'elevated', v)}
              container={containerRef.current}
            />
          </ColorSection>

          {/* Text Colors */}
          <ColorSection
            title='Text Colors'
            isOpen={openSections.includes('text')}
            onToggle={() => toggleSection('text')}
          >
            <ColorPicker
              label='Primary'
              description='Main text color'
              value={getTokenValue('text', 'primary')}
              onChange={v => updateOverride('text', 'primary', v)}
              container={containerRef.current}
            />
            <ColorPicker
              label='Secondary'
              description='Secondary text color'
              value={getTokenValue('text', 'secondary')}
              onChange={v => updateOverride('text', 'secondary', v)}
              container={containerRef.current}
            />
            <ColorPicker
              label='Muted'
              description='Muted and placeholder text'
              value={getTokenValue('text', 'muted')}
              onChange={v => updateOverride('text', 'muted', v)}
              container={containerRef.current}
            />
          </ColorSection>

          {/* Status Colors */}
          <ColorSection
            title='Status Colors'
            isOpen={openSections.includes('status')}
            onToggle={() => toggleSection('status')}
          >
            <ColorPicker
              label='Success'
              description='Success states and positive actions'
              value={getTokenValue('status', 'success')}
              onChange={v => updateOverride('status', 'success', v)}
              container={containerRef.current}
            />
            <ColorPicker
              label='Warning'
              description='Warning states'
              value={getTokenValue('status', 'warning')}
              onChange={v => updateOverride('status', 'warning', v)}
              container={containerRef.current}
            />
            <ColorPicker
              label='Error'
              description='Error states and destructive actions'
              value={getTokenValue('status', 'error')}
              onChange={v => updateOverride('status', 'error', v)}
              container={containerRef.current}
            />
          </ColorSection>
        </div>
      </div>

      {/* Actions */}
      <div className='flex gap-3 pt-4 border-t border-border'>
        <Button
          variant='ghost'
          className='flex-1'
          onClick={() => onOpenChange(false)}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          className='flex-1'
          onClick={handleSave}
          disabled={isSaving || !name.trim()}
        >
          {isSaving && <Loader2 className='h-4 w-4 mr-2 animate-spin' />}
          {isEditing ? 'Save Changes' : 'Create Theme'}
        </Button>
      </div>
    </div>
  );

  // Mobile: Drawer from bottom with preview on top
  if (isMobile) {
    return (
      <>
        {/* Live Preview - Top half on mobile, constrained to available space */}
        {open && (
          <div className='fixed inset-x-0 top-0 bottom-1/2 z-[100] p-4 flex items-center justify-center overflow-hidden animate-in fade-in duration-300'>
            <ThemePreview
              baseTheme={baseTheme}
              overrides={overrides}
              className='border border-border shadow-overlay w-full max-w-xs max-h-full overflow-auto'
            />
          </div>
        )}

        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className='max-h-[50vh] flex flex-col'>
            <DrawerHeader className='flex-shrink-0'>
              <DrawerTitle>
                {isEditing ? 'Edit Custom Theme' : 'Create Custom Theme'}
              </DrawerTitle>
            </DrawerHeader>
            <div className='flex-1 overflow-y-auto px-4 pb-4'>
              {formContent}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop: Sheet from right with preview to the left
  return (
    <>
      {/* Live Preview - Left of sheet on desktop */}
      {open && (
        <div className='fixed right-[34rem] top-1/2 -translate-y-1/2 w-80 z-[100] animate-in slide-in-from-right-4 fade-in duration-300'>
          <ThemePreview
            baseTheme={baseTheme}
            overrides={overrides}
            className='border border-border shadow-overlay'
          />
        </div>
      )}

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side='right'
          className='w-full sm:max-w-lg overflow-y-auto'
        >
          <SheetHeader>
            <SheetTitle>
              {isEditing ? 'Edit Custom Theme' : 'Create Custom Theme'}
            </SheetTitle>
            <SheetDescription>
              Customize colors and create your unique theme.
            </SheetDescription>
          </SheetHeader>
          <div className='mt-6'>{formContent}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// Collapsible color section component
interface ColorSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function ColorSection({
  title,
  isOpen,
  onToggle,
  children,
}: ColorSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className='flex w-full items-center justify-between rounded-card border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-bg-surface transition-colors'>
        {title}
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className='space-y-4 px-1 pt-4'>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
