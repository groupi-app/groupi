'use client';

import { forwardRef } from 'react';
import { SuggestionList, type SuggestionItemConfig } from './suggestion-list';

export interface SlashCommand {
  id: string;
  label: string;
  description: string;
  command: (editor: unknown) => void;
}

interface SlashCommandListProps {
  items: SlashCommand[];
  command: (item: SlashCommand) => void;
}

export const SlashCommandList = forwardRef<
  { onKeyDown: (props: { event: KeyboardEvent }) => boolean },
  SlashCommandListProps
>(({ items, command }, ref) => {
  const config: SuggestionItemConfig<SlashCommand> = {
    getKey: item => item.id,
    renderPrefix: () => (
      <span className='text-muted-foreground text-sm'>/</span>
    ),
    getPrimaryText: item => item.label,
    getSecondaryText: item => item.description,
    layout: 'vertical',
  };

  return (
    <SuggestionList ref={ref} items={items} command={command} config={config} />
  );
});

SlashCommandList.displayName = 'SlashCommandList';
