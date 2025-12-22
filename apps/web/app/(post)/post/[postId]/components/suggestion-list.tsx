'use client';

import { useLayoutEffect, useImperativeHandle, forwardRef, useState, ReactNode, type ForwardedRef } from 'react';

export interface SuggestionItemConfig<T> {
  getKey: (item: T) => string;
  renderPrefix?: (item: T) => ReactNode;
  getPrimaryText: (item: T) => string;
  getSecondaryText?: (item: T) => string | null;
  layout?: 'horizontal' | 'vertical';
}

interface SuggestionListProps<T> {
  items: T[];
  command: (item: T) => void;
  isMobile?: boolean;
  config: SuggestionItemConfig<T>;
}

function SuggestionListInner<T>(
  { items, command, isMobile = false, config }: SuggestionListProps<T>,
  ref: ForwardedRef<{ onKeyDown: (props: { event: KeyboardEvent }) => boolean }>
) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
      const item = items[index];
      if (item) {
        command(item);
      }
    };

    const upHandler = () => {
      setSelectedIndex(
        (selectedIndex + items.length - 1) % items.length
      );
    };

    const downHandler = () => {
      setSelectedIndex((selectedIndex + 1) % items.length);
    };

    const enterHandler = () => {
      selectItem(selectedIndex);
    };

    // Reset selected index when items change (useLayoutEffect for synchronous reset)
    useLayoutEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronous reset needed when items change
      setSelectedIndex(0);
    }, [items.length]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          upHandler();
          return true;
        }

        if (event.key === 'ArrowDown') {
          downHandler();
          return true;
        }

        if (event.key === 'Enter') {
          enterHandler();
          return true;
        }

        if (event.key === 'Tab') {
          enterHandler();
          return true;
        }

        return false;
      },
    }));

    if (items.length === 0) {
      return null;
    }

    const isHorizontal = config.layout === 'horizontal';

    return (
      <div className={`bg-background border border-border shadow-lg p-1 min-w-[200px] max-h-[200px] overflow-y-auto ${
        isMobile 
          ? 'rounded-t-md' 
          : 'rounded-md'
      }`}>
        {items.map((item, index) => {
          const key = config.getKey(item);
          const primaryText = config.getPrimaryText(item);
          const secondaryText = config.getSecondaryText?.(item);
          const prefix = config.renderPrefix?.(item);
          const isSelected = index === selectedIndex;

          return (
            <button
              key={key}
              className={`w-full text-left px-2 py-1.5 rounded-sm ${
                isHorizontal ? 'flex items-center gap-2' : 'flex flex-col gap-0.5'
              } ${
                isSelected
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50'
              }`}
              onClick={() => selectItem(index)}
            >
              {prefix && isHorizontal && (
                <div>
                  {prefix}
                </div>
              )}
              <div className={isHorizontal ? 'flex-1 min-w-0' : ''}>
                {prefix && !isHorizontal && (
                  <div className='flex items-center gap-0.5'>
                    {prefix}
                    <span className='text-sm font-medium'>{primaryText}</span>
                  </div>
                )}
                {(!prefix || isHorizontal) && (
                  <div className={`text-sm font-medium ${isHorizontal ? 'truncate' : ''}`}>
                    {primaryText}
                  </div>
                )}
                {secondaryText && (
                  <div className={`text-xs text-muted-foreground ${isHorizontal ? 'truncate' : 'truncate'}`}>
                    {secondaryText}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
}

export const SuggestionList = forwardRef(SuggestionListInner) as <T>(
  props: SuggestionListProps<T> & { ref?: ForwardedRef<{ onKeyDown: (props: { event: KeyboardEvent }) => boolean }> }
) => React.JSX.Element & { displayName?: string };

(SuggestionList as typeof SuggestionList & { displayName: string }).displayName = 'SuggestionList';

