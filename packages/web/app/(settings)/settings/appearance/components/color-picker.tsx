'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  container?: HTMLElement | null;
  /** Enable opacity/alpha slider */
  showOpacity?: boolean;
}

/**
 * Parse HSL/HSLA string to components
 * Handles formats like "hsl(348, 79%, 81%)", "hsl(348 79% 81%)", "hsla(348, 79%, 81%, 0.5)"
 */
function parseHsl(hslString: string): {
  h: number;
  s: number;
  l: number;
  a: number;
} {
  // Try to parse HSLA format first
  const hslaMatch = hslString.match(
    /hsla?\(\s*(\d+)\s*[,\s]\s*(\d+)%?\s*[,\s]\s*(\d+)%?\s*(?:[,/]\s*([\d.]+)\s*)?\)/i
  );

  if (hslaMatch) {
    return {
      h: parseInt(hslaMatch[1], 10),
      s: parseInt(hslaMatch[2], 10),
      l: parseInt(hslaMatch[3], 10),
      a: hslaMatch[4] ? parseFloat(hslaMatch[4]) : 1,
    };
  }

  // If already hex, convert
  if (hslString.startsWith('#')) {
    const hex = hslString.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const a = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) / 255 : 1;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    let h = 0;
    let s = 0;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
      a,
    };
  }

  // Default fallback
  return { h: 0, s: 0, l: 0, a: 1 };
}

/**
 * Convert HSL components to hex color (without alpha)
 */
function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert hex color to HSL components
 */
function hexToHslComponents(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace('#', '');

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Format HSL components to string
 */
function formatHsl(h: number, s: number, l: number, a: number): string {
  if (a < 1) {
    return `hsla(${h}, ${s}%, ${l}%, ${a.toFixed(2)})`;
  }
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/**
 * Simple color picker with hex input, visual preview, and optional opacity slider.
 * Uses native color picker for color selection.
 * Accepts both HSL/HSLA and hex values, outputs HSL/HSLA.
 */
export function ColorPicker({
  label,
  value,
  onChange,
  description,
  container,
  showOpacity = false,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse incoming value to HSL components - fully derived from props
  const { hex, opacity } = useMemo(() => {
    const parsed = parseHsl(value);
    return {
      hex: hslToHex(parsed.h, parsed.s, parsed.l),
      opacity: parsed.a,
    };
  }, [value]);

  const handleColorChange = useCallback(
    (newHexValue: string) => {
      if (/^#[0-9A-Fa-f]{6}$/i.test(newHexValue)) {
        const { h, s, l } = hexToHslComponents(newHexValue);
        onChange(formatHsl(h, s, l, opacity));
      }
    },
    [onChange, opacity]
  );

  const handleOpacityChange = useCallback(
    (values: number[]) => {
      const newOpacity = values[0];
      const { h, s, l } = hexToHslComponents(hex);
      onChange(formatHsl(h, s, l, newOpacity));
    },
    [onChange, hex]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value.toUpperCase();
      // Ensure it starts with #
      if (!newValue.startsWith('#')) {
        newValue = '#' + newValue;
      }
      // Only update if it looks like a valid hex (partial or complete)
      if (/^#[0-9A-Fa-f]{0,6}$/i.test(newValue)) {
        // For partial values, we need local state - but only emit when complete
        if (newValue.length === 7) {
          handleColorChange(newValue);
        }
      }
    },
    [handleColorChange]
  );

  // Display color with opacity
  const displayColor =
    opacity < 1
      ? `${hex}${Math.round(opacity * 255)
          .toString(16)
          .padStart(2, '0')}`
      : hex;

  return (
    <div className='space-y-1'>
      <Label className='text-sm font-medium'>{label}</Label>
      {description && (
        <p className='text-xs text-muted-foreground'>{description}</p>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            className='w-full justify-start gap-2 h-10 cursor-pointer'
          >
            <div
              className='h-5 w-5 rounded-rounded border border-border'
              style={{ backgroundColor: displayColor }}
            />
            <span className='font-mono text-sm'>
              {hex}
              {showOpacity && opacity < 1 && (
                <span className='text-muted-foreground ml-1'>
                  {Math.round(opacity * 100)}%
                </span>
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-64' align='start' container={container}>
          <div className='space-y-4'>
            {/* Native color picker */}
            <div className='flex gap-2'>
              <input
                type='color'
                value={hex}
                onChange={e => handleColorChange(e.target.value)}
                className='h-10 w-10 cursor-pointer rounded-rounded border border-border bg-transparent'
                style={{ padding: 0 }}
              />
              <Input
                value={hex}
                onChange={handleInputChange}
                className='flex-1 font-mono'
                placeholder='#000000'
                maxLength={7}
              />
            </div>

            {/* Opacity slider */}
            {showOpacity && (
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <Label className='text-xs text-muted-foreground'>
                    Opacity
                  </Label>
                  <span className='text-xs text-muted-foreground'>
                    {Math.round(opacity * 100)}%
                  </span>
                </div>
                <div
                  className='h-3 rounded-full border border-border'
                  style={{
                    background: `linear-gradient(to right, transparent, ${hex})`,
                  }}
                >
                  <Slider
                    value={[opacity]}
                    onValueChange={handleOpacityChange}
                    min={0}
                    max={1}
                    step={0.01}
                    className='h-3'
                  />
                </div>
              </div>
            )}

            {/* Common colors */}
            <div className='space-y-2'>
              <Label className='text-xs text-muted-foreground'>
                Quick colors
              </Label>
              <div className='grid grid-cols-8 gap-1'>
                {QUICK_COLORS.map(color => (
                  <button
                    key={color}
                    type='button'
                    onClick={() => handleColorChange(color)}
                    className={cn(
                      'h-6 w-6 rounded-sm border transition-all cursor-pointer',
                      hex.toUpperCase() === color.toUpperCase()
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : 'border-border hover:scale-110'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Common colors for quick selection
const QUICK_COLORS = [
  '#8b5cf6', // violet
  '#6366f1', // indigo
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#84cc16', // lime
  '#eab308', // yellow
  '#f97316', // orange
  '#ef4444', // red
  '#ec4899', // pink
  '#f43f5e', // rose
  '#a855f7', // purple
  '#14b8a6', // teal
  '#22c55e', // green
  '#facc15', // amber
  '#fb923c', // orange light
  '#ffffff', // white
  '#f5f5f5', // gray-100
  '#e5e5e5', // gray-200
  '#a3a3a3', // gray-400
  '#737373', // gray-500
  '#525252', // gray-600
  '#262626', // gray-800
  '#000000', // black
];
