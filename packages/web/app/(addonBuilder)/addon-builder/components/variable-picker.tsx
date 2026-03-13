'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type {
  TriggerType,
  CustomAddonTemplate,
} from '@/lib/custom-addon-schema';
import {
  getDataBlocksForTrigger,
  DATA_GROUP_LABELS,
  type DataBlock,
  type DataBlockGroup,
} from './building-blocks';

interface VariablePickerProps {
  template: CustomAddonTemplate;
  triggerType?: TriggerType;
  onInsert: (variable: string) => void;
}

export function VariablePicker({
  template,
  triggerType,
  onInsert,
}: VariablePickerProps) {
  const [open, setOpen] = useState(false);
  const blocks = useMemo(
    () => getDataBlocksForTrigger(template, triggerType),
    [template, triggerType]
  );

  // Group blocks by their group
  const groups = useMemo(() => {
    const map = new Map<DataBlockGroup, DataBlock[]>();
    for (const block of blocks) {
      const list = map.get(block.group) ?? [];
      list.push(block);
      map.set(block.group, list);
    }
    return map;
  }, [blocks]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='h-7 text-xs px-2'
          type='button'
        >
          {'{{ }}'}
          <span className='ml-1'>Insert variable</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-64 p-0' align='start'>
        <div className='max-h-64 overflow-y-auto'>
          {[...groups.entries()].map(([group, groupBlocks]) => (
            <div key={group}>
              <div className='px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted'>
                {DATA_GROUP_LABELS[group]}
              </div>
              {groupBlocks.map(block => (
                <button
                  key={block.id}
                  type='button'
                  className='w-full text-left px-3 py-1.5 text-sm hover:bg-bg-interactive transition-colors'
                  onClick={() => {
                    onInsert(block.insertValue);
                    setOpen(false);
                  }}
                >
                  <span className='font-mono text-xs text-primary'>
                    {block.insertValue}
                  </span>
                  <span className='block text-xs text-muted-foreground'>
                    {block.description}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
