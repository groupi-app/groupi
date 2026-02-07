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

export type TimeFilter = 'upcoming' | 'past';
export type SortBy = 'title' | 'createdat' | 'eventdate' | 'lastactivity';

export interface EventFiltersProps {
  /** Whether to show only events user is hosting */
  onlyMine: boolean;
  /** Sort by value */
  sortBy: SortBy;
  /** Callback when only mine toggle changes */
  onOnlyMineChange: (value: boolean) => void;
  /** Callback when sort changes */
  onSortChange: (value: SortBy) => void;
  /** Additional class names */
  className?: string;
}

/**
 * EventFilters - Ownership toggle and sort dropdown
 *
 * Ownership toggle: Only my events
 * Sort dropdown: Various sort options
 */
export function EventFilters({
  onlyMine,
  sortBy,
  onOnlyMineChange,
  onSortChange,
  className,
}: EventFiltersProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-4', className)}>
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
