'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFilterSortStore as useFilterSort } from '@/stores/filter-sort-store';

type SortBy = 'title' | 'createdat' | 'eventdate' | 'lastactivity';

/**
 * Client component for filter and sort controls
 * HTML is statically generated (rendered in server component)
 * Becomes interactive after hydration
 */
export function FilterSortControls() {
  const { sortBy, filter, setSortBy, setFilter } = useFilterSort();

  return (
    <div className='flex flex-col md:flex-row md:items-center gap-2'>
      <div className='flex items-center'>
        <Button
          className='rounded-r-none'
          onClick={() => setFilter('all')}
          variant={filter === 'all' ? 'secondary' : 'outline'}
        >
          All
        </Button>
        <Button
          className='rounded-l-none'
          onClick={() => setFilter('my')}
          variant={filter === 'my' ? 'secondary' : 'outline'}
        >
          Owned by me
        </Button>
      </div>
      <div className='w-full md:w-36'>
        <Select
          value={sortBy}
          onValueChange={value => setSortBy(value as SortBy)}
        >
          <SelectTrigger aria-label='Sort events by'>
            <SelectValue placeholder='Sort By' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Sort By</SelectLabel>
              <SelectItem value='title'>Title</SelectItem>
              <SelectItem value='createdat'>Date Created</SelectItem>
              <SelectItem value='eventdate'>Event Date</SelectItem>
              <SelectItem value='lastactivity'>Latest Activity</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
