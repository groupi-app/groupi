'use client';

import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type TimeFilter = 'upcoming' | 'past';
export type SortBy = 'title' | 'createdat' | 'eventdate' | 'lastactivity';

export interface EventFiltersProps {
  /** Time filter value */
  timeFilter: TimeFilter;
  /** Whether to show only events user is hosting */
  onlyMine: boolean;
  /** Sort by value */
  sortBy: SortBy;
  /** Callback when time filter changes */
  onTimeFilterChange: (value: TimeFilter) => void;
  /** Callback when only mine toggle changes */
  onOnlyMineChange: (value: boolean) => void;
  /** Callback when sort changes */
  onSortChange: (value: SortBy) => void;
  /** Counts for badges */
  counts?: {
    upcoming: number;
    past: number;
  };
  /** Additional class names */
  className?: string;
}

/**
 * EventFilters - Time filter tabs and ownership toggle
 *
 * Time filter: Upcoming / Attended (past)
 * Ownership toggle: Only my events
 */
export function EventFilters({
  timeFilter,
  onlyMine,
  sortBy,
  onTimeFilterChange,
  onOnlyMineChange,
  onSortChange,
  counts,
  className,
}: EventFiltersProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-4', className)}>
      {/* Time filter with animated tabs */}
      <Tabs
        value={timeFilter}
        onValueChange={value => onTimeFilterChange(value as TimeFilter)}
        layoutId='event-time-filter'
      >
        <TabsList aria-label='Filter by time'>
          <TabsTrigger value='upcoming'>
            Upcoming
            {counts?.upcoming !== undefined && counts.upcoming > 0 && (
              <span
                className={cn(
                  'ml-1.5 text-xs',
                  timeFilter === 'upcoming' ? 'text-muted-foreground' : ''
                )}
              >
                {counts.upcoming}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value='past'>
            Attended
            {counts?.past !== undefined && counts.past > 0 && (
              <span
                className={cn(
                  'ml-1.5 text-xs',
                  timeFilter === 'past' ? 'text-muted-foreground' : ''
                )}
              >
                {counts.past}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Ownership toggle */}
      <div className='flex items-center gap-2'>
        <Switch
          id='only-mine'
          checked={onlyMine}
          onCheckedChange={onOnlyMineChange}
        />
        <Label
          htmlFor='only-mine'
          className={cn(
            'text-sm font-medium cursor-pointer transition-colors',
            onlyMine ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          Only my events
        </Label>
      </div>

      {/* Sort dropdown */}
      <div className='ml-auto'>
        <Select
          value={sortBy}
          onValueChange={value => onSortChange(value as SortBy)}
        >
          <SelectTrigger className='w-[160px]' aria-label='Sort events by'>
            <SelectValue placeholder='Sort By' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Sort By</SelectLabel>
              <SelectItem value='lastactivity'>Latest Activity</SelectItem>
              <SelectItem value='eventdate'>Event Date</SelectItem>
              <SelectItem value='createdat'>Date Created</SelectItem>
              <SelectItem value='title'>Title</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
