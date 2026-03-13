'use client';

import { useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Icons } from '@/components/icons';
import { useBuilder } from './builder-context';
import {
  getDataBlocks,
  getActionBlocks,
  DATA_GROUP_LABELS,
  ACTION_GROUP_LABELS,
  type DataBlock,
  type DataBlockGroup,
  type ActionBlock,
  type ActionBlockGroup,
} from './building-blocks';

function DataBlockRow({
  block,
  onInsert,
}: {
  block: DataBlock;
  onInsert: (variable: string) => void;
}) {
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(block.insertValue);
  }, [block.insertValue]);

  return (
    <div className='flex items-center gap-2 px-3 py-1.5'>
      <button
        type='button'
        className='flex min-w-0 flex-1 items-start gap-2 text-left hover:bg-bg-interactive rounded-input p-1 -m-1 transition-colors'
        onClick={() => onInsert(block.insertValue)}
      >
        <code className='shrink-0 rounded-badge bg-muted px-1.5 py-0.5 font-mono text-[10px] text-primary'>
          {block.path}
        </code>
        <span className='text-xs text-muted-foreground truncate'>
          {block.description}
        </span>
      </button>
      <Button
        variant='ghost'
        size='sm'
        className='h-6 w-6 shrink-0 p-0'
        onClick={handleCopy}
        type='button'
        title='Copy to clipboard'
      >
        <Icons.copy className='size-3' />
      </Button>
    </div>
  );
}

function ActionBlockRow({ block }: { block: ActionBlock }) {
  return (
    <div className='flex items-start gap-2 px-3 py-1.5'>
      <div className='min-w-0 flex-1'>
        <p className='text-sm font-medium'>{block.label}</p>
        <p className='text-xs text-muted-foreground'>{block.description}</p>
      </div>
    </div>
  );
}

function DataBlockGroupSection({
  group,
  blocks,
  onInsert,
}: {
  group: DataBlockGroup;
  blocks: DataBlock[];
  onInsert: (variable: string) => void;
}) {
  if (blocks.length === 0) {
    if (group === 'fields') {
      return (
        <div>
          <div className='bg-muted px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground'>
            {DATA_GROUP_LABELS[group]}
          </div>
          <p className='px-3 py-2 text-xs text-muted-foreground italic'>
            Add fields to your sections to see them here
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <div>
      <div className='bg-muted px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground'>
        {DATA_GROUP_LABELS[group]}
      </div>
      {blocks.map(block => (
        <DataBlockRow key={block.id} block={block} onInsert={onInsert} />
      ))}
    </div>
  );
}

function ActionBlockGroupSection({
  group,
  blocks,
}: {
  group: ActionBlockGroup;
  blocks: ActionBlock[];
}) {
  if (blocks.length === 0) return null;

  return (
    <div>
      <div className='bg-muted px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground'>
        {ACTION_GROUP_LABELS[group]}
      </div>
      {blocks.map(block => (
        <ActionBlockRow key={block.id} block={block} />
      ))}
    </div>
  );
}

export function ToolboxPanel() {
  const { template, insertVariable } = useBuilder();

  const dataBlocks = useMemo(() => getDataBlocks(template), [template]);
  const actionBlocks = useMemo(() => getActionBlocks(), []);

  // Group data blocks
  const dataGroups = useMemo(() => {
    const groups = new Map<DataBlockGroup, DataBlock[]>();
    for (const block of dataBlocks) {
      const list = groups.get(block.group) ?? [];
      list.push(block);
      groups.set(block.group, list);
    }
    return groups;
  }, [dataBlocks]);

  // Group action blocks
  const actionGroups = useMemo(() => {
    const groups = new Map<ActionBlockGroup, ActionBlock[]>();
    for (const block of actionBlocks) {
      const list = groups.get(block.group) ?? [];
      list.push(block);
      groups.set(block.group, list);
    }
    return groups;
  }, [actionBlocks]);

  // Display order for data groups
  const dataGroupOrder: DataBlockGroup[] = [
    'event',
    'addon',
    'member',
    'fields',
    'vote',
  ];

  const actionGroupOrder: ActionBlockGroup[] = [
    'notify',
    'content',
    'integration',
    'data',
  ];

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger asChild>
        <Button
          variant='ghost'
          className='flex w-full items-center justify-between px-0 py-2 font-semibold hover:bg-transparent'
          type='button'
        >
          <div className='flex items-center gap-2'>
            <Icons.blocks className='size-4' />
            <span>Toolbox</span>
          </div>
          <Icons.down className='size-4 transition-transform [[data-state=closed]_&]:rotate-[-90deg]' />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className='rounded-card border'>
          <Tabs defaultValue='data'>
            <TabsList className='w-full grid grid-cols-2 rounded-none rounded-t-card'>
              <TabsTrigger value='data' className='text-xs'>
                Data
              </TabsTrigger>
              <TabsTrigger value='actions' className='text-xs'>
                Actions
              </TabsTrigger>
            </TabsList>

            <TabsContent value='data' className='mt-0'>
              <div className='max-h-64 overflow-y-auto'>
                {dataGroupOrder.map(group => (
                  <DataBlockGroupSection
                    key={group}
                    group={group}
                    blocks={dataGroups.get(group) ?? []}
                    onInsert={insertVariable}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value='actions' className='mt-0'>
              <div className='max-h-64 overflow-y-auto'>
                {actionGroupOrder.map(group => (
                  <ActionBlockGroupSection
                    key={group}
                    group={group}
                    blocks={actionGroups.get(group) ?? []}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
