'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export type EventTabValue = 'upcoming' | 'hosting' | 'attended';

export interface EventTabFilterProps {
  /** Currently selected tab */
  value: EventTabValue;
  /** Callback when tab changes */
  onChange: (value: EventTabValue) => void;
  /** Event counts for each tab */
  counts?: {
    upcoming: number;
    hosting: number;
    attended: number;
  };
  /** Additional class names */
  className?: string;
}

interface TabConfig {
  value: EventTabValue;
  label: string;
}

const tabs: TabConfig[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'hosting', label: 'Hosting' },
  { value: 'attended', label: 'Attended' },
];

/**
 * EventTabFilter - Tab-based filtering for events list
 *
 * Provides Upcoming/Hosting/Attended tabs for filtering events.
 */
export function EventTabFilter({
  value,
  onChange,
  counts,
  className,
}: EventTabFilterProps) {
  return (
    <Tabs
      value={value}
      onValueChange={next => {
        if (next === 'upcoming' || next === 'hosting' || next === 'attended')
          onChange(next);
      }}
      className={className}
    >
      <TabsList aria-label='Filter events'>
        {tabs.map(tab => {
          const isSelected = value === tab.value;
          const count = counts?.[tab.value];

          return (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
              {count !== undefined && count > 0 && (
                <span
                  className={cn(
                    'ml-1.5 text-xs',
                    isSelected ? 'text-muted-foreground' : ''
                  )}
                >
                  {count}
                </span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
