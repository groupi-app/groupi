'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

interface SortConfigProps {
  fields: { name: string; type: string; label: string }[];
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onChange: (field: string, direction: 'asc' | 'desc') => void;
}

export function SortConfig({
  fields,
  sortField,
  sortDirection,
  onChange,
}: SortConfigProps) {
  return (
    <div className='flex items-center gap-4'>
      <div className='flex-1'>
        <Select
          value={sortField}
          onValueChange={value => onChange(value, sortDirection)}
        >
          <SelectTrigger>
            <SelectValue placeholder='Select field to sort by' />
          </SelectTrigger>
          <SelectContent>
            {fields.map(field => (
              <SelectItem key={field.name} value={field.name}>
                {field.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant='outline'
        size='icon'
        onClick={() =>
          onChange(sortField, sortDirection === 'asc' ? 'desc' : 'asc')
        }
      >
        {sortDirection === 'asc' ? (
          <Icons.up className='h-4 w-4' />
        ) : (
          <Icons.down className='h-4 w-4' />
        )}
      </Button>

      <span className='text-sm text-muted-foreground w-24'>
        {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
      </span>
    </div>
  );
}
