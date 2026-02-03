'use client';

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
    <div
      className={cn('inline-flex gap-1 p-1 rounded-button bg-muted', className)}
      role='tablist'
    >
      {tabs.map(tab => {
        const isSelected = value === tab.value;
        const count = counts?.[tab.value];

        return (
          <button
            key={tab.value}
            role='tab'
            aria-selected={isSelected}
            onClick={() => onChange(tab.value)}
            className={cn(
              'px-3 py-1.5 rounded-button text-sm font-medium transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isSelected
                ? 'bg-background text-foreground shadow-raised'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
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
          </button>
        );
      })}
    </div>
  );
}
