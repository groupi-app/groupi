'use client';

import { useState } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Curated list of icons suitable for addons (excluding aliases and complex SVGs)
const ADDON_ICONS = [
  'listChecks',
  'list',
  'listOrdered',
  'check',
  'bell',
  'megaphone',
  'clock',
  'date',
  'time',
  'messageSquare',
  'mail',
  'people',
  'account',
  'heart',
  'sparkles',
  'settings',
  'sliders',
  'search',
  'info',
  'warning',
  'alertCircle',
  'edit',
  'save',
  'download',
  'copy',
  'link',
  'key',
  'lock',
  'eye',
  'location',
  'crown',
  'shield',
  'shieldCheck',
  'party',
  'invite',
  'file',
  'image',
  'paperclip',
  'code',
  'palette',
  'inbox',
  'fingerprint',
] as const;

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const SelectedIcon =
    (Icons as Record<string, React.ComponentType<{ className?: string }>>)[
      value
    ] ?? Icons.info;

  const filteredIcons = ADDON_ICONS.filter(name =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className='flex items-center gap-2 rounded-input'
        >
          <SelectedIcon className='size-4' />
          <span className='text-sm'>{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-72 rounded-dropdown p-3' align='start'>
        <Input
          placeholder='Search icons...'
          value={search}
          onChange={e => setSearch(e.target.value)}
          className='mb-2 rounded-input'
        />
        <div className='grid max-h-48 grid-cols-6 gap-1 overflow-y-auto'>
          {filteredIcons.map(iconName => {
            const Icon = (
              Icons as Record<
                string,
                React.ComponentType<{ className?: string }>
              >
            )[iconName];
            if (!Icon) return null;
            return (
              <button
                key={iconName}
                className={cn(
                  'flex size-9 items-center justify-center rounded-button transition-colors hover:bg-bg-interactive',
                  value === iconName && 'bg-primary text-primary-foreground'
                )}
                onClick={() => {
                  onChange(iconName);
                  setOpen(false);
                  setSearch('');
                }}
                title={iconName}
                type='button'
              >
                <Icon className='size-4' />
              </button>
            );
          })}
          {filteredIcons.length === 0 && (
            <p className='col-span-6 py-4 text-center text-sm text-muted-foreground'>
              No icons found
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
