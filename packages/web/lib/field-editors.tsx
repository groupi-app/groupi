'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import type { ListItem } from '@/lib/custom-addon-schema';

let nextId = 0;

export function generateId(): string {
  return `${Date.now().toString(36)}${(nextId++).toString(36)}`;
}

export function OptionsEditor({
  options,
  onChange,
}: {
  options: string[];
  onChange: (options: string[]) => void;
}) {
  return (
    <div className='space-y-1'>
      <Label className='text-xs'>Options</Label>
      {options.map((opt, i) => (
        <div key={i} className='flex items-center gap-1'>
          <Input
            value={opt}
            onChange={e => {
              const updated = [...options];
              updated[i] = e.target.value;
              onChange(updated);
            }}
            placeholder={`Option ${i + 1}`}
            className='h-8 rounded-input text-sm'
          />
          {options.length > 2 && (
            <Button
              variant='ghost'
              size='icon'
              className='size-8 shrink-0'
              onClick={() => onChange(options.filter((_, j) => j !== i))}
            >
              <Icons.close className='size-3' />
            </Button>
          )}
        </div>
      ))}
      <Button
        variant='ghost'
        size='sm'
        className='h-7 text-xs'
        onClick={() => onChange([...options, ''])}
      >
        <Icons.plus className='mr-1 size-3' />
        Add option
      </Button>
    </div>
  );
}

export function ListItemsEditor({
  items,
  onChange,
}: {
  items: ListItem[];
  onChange: (items: ListItem[]) => void;
}) {
  return (
    <div className='space-y-1'>
      <Label className='text-xs'>Items</Label>
      {items.map((item, i) => (
        <div key={item.id} className='flex items-center gap-1'>
          <Input
            value={item.name}
            onChange={e => {
              const updated = [...items];
              updated[i] = { ...item, name: e.target.value };
              onChange(updated);
            }}
            placeholder='Item name'
            className='h-8 flex-1 rounded-input text-sm'
          />
          <Input
            type='number'
            value={item.quantity}
            onChange={e => {
              const updated = [...items];
              updated[i] = { ...item, quantity: parseInt(e.target.value) || 1 };
              onChange(updated);
            }}
            min={1}
            className='h-8 w-16 rounded-input text-sm'
          />
          {items.length > 1 && (
            <Button
              variant='ghost'
              size='icon'
              className='size-8 shrink-0'
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              <Icons.close className='size-3' />
            </Button>
          )}
        </div>
      ))}
      <Button
        variant='ghost'
        size='sm'
        className='h-7 text-xs'
        onClick={() =>
          onChange([...items, { id: generateId(), name: '', quantity: 1 }])
        }
      >
        <Icons.plus className='mr-1 size-3' />
        Add item
      </Button>
    </div>
  );
}
