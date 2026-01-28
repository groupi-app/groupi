'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

// Lazy-load the API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _api: any;
function getApi() {
  if (!_api) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _api = require('@/convex/_generated/api').api;
  }
  return _api;
}

export type EntityType = 'user' | 'event' | 'post';

interface EntityPickerProps {
  entityType: EntityType;
  value: string;
  selectedLabel?: string;
  onChange: (entityId: string, label: string) => void;
  placeholder?: string;
  className?: string;
}

interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  type: EntityType;
}

export function EntityPicker({
  entityType,
  value,
  selectedLabel,
  onChange,
  placeholder,
  className,
}: EntityPickerProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [displayLabel, setDisplayLabel] = useState(selectedLabel || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const api = getApi();

  // Search for entities
  const searchResults = useQuery(
    api.admin.queryBuilder.searchEntities,
    search.length >= 1 ? { entityType, search, limit: 10 } : 'skip'
  ) as SearchResult[] | undefined;

  // Update display label when selectedLabel prop changes
  useEffect(() => {
    if (selectedLabel) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing prop to state
      setDisplayLabel(selectedLabel);
    }
  }, [selectedLabel]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        if (value && displayLabel) {
          setSearch('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, displayLabel]);

  const handleSelect = (result: SearchResult) => {
    onChange(result.id, result.label);
    setDisplayLabel(result.label);
    setSearch('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('', '');
    setDisplayLabel('');
    setSearch('');
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const getEntityIcon = () => {
    switch (entityType) {
      case 'user':
        return <Icons.users className='h-4 w-4 text-muted-foreground' />;
      case 'event':
        return <Icons.calendar className='h-4 w-4 text-muted-foreground' />;
      case 'post':
        return (
          <Icons.messageSquare className='h-4 w-4 text-muted-foreground' />
        );
    }
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    switch (entityType) {
      case 'user':
        return 'Search users...';
      case 'event':
        return 'Search events...';
      case 'post':
        return 'Search posts...';
    }
  };

  return (
    <div ref={containerRef} className={cn('relative min-w-[200px]', className)}>
      <div className='relative flex items-center'>
        <div className='absolute left-2 pointer-events-none'>
          {getEntityIcon()}
        </div>
        <input
          ref={inputRef}
          type='text'
          className='flex h-10 w-full min-w-[180px] rounded-md border border-input bg-background pl-8 pr-8 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
          placeholder={getPlaceholder()}
          value={isOpen ? search : displayLabel || search}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
        />
        {(value || displayLabel) && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='absolute right-1 h-6 w-6 p-0'
            onClick={handleClear}
          >
            <Icons.x className='h-3 w-3' />
          </Button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && search.length >= 1 && (
        <div className='absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto'>
          {searchResults === undefined ? (
            <div className='p-2 text-sm text-muted-foreground text-center'>
              Searching...
            </div>
          ) : searchResults.length === 0 ? (
            <div className='p-2 text-sm text-muted-foreground text-center'>
              No results found
            </div>
          ) : (
            searchResults.map(result => (
              <button
                key={result.id}
                type='button'
                className='w-full px-3 py-2 text-left hover:bg-muted transition-colors flex items-start gap-2'
                onClick={() => handleSelect(result)}
              >
                <div className='mt-0.5'>{getEntityIcon()}</div>
                <div className='flex-1 min-w-0'>
                  <div className='text-sm font-medium truncate'>
                    {result.label}
                  </div>
                  <div className='text-xs text-muted-foreground truncate'>
                    {result.sublabel}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
