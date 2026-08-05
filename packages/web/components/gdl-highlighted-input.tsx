'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { tokenizeGDL } from '@groupi/shared';

type TokenType =
  | 'day'
  | 'date'
  | 'time'
  | 'operator'
  | 'bracket'
  | 'recurrence'
  | 'note'
  | 'combiner'
  | 'separator'
  | 'whitespace'
  | 'error';

const TOKEN_STYLES: Record<TokenType, string | undefined> = {
  day: '#60a5fa',
  date: '#22d3ee',
  time: '#fbbf24',
  operator: '#c084fc',
  bracket: '#d8b4fe',
  recurrence: '#f472b6',
  note: '#4ade80',
  combiner: '#a855f7',
  separator: undefined,
  whitespace: undefined,
  error: '#f87171',
};

interface GDLHighlightedInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  highlight?: boolean;
  rainbowFocus?: boolean;
}

export function GDLHighlightedInput({
  value,
  onChange,
  onKeyDown,
  placeholder,
  disabled,
  className,
  highlight = true,
  rainbowFocus = false,
}: GDLHighlightedInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const showOverlay = highlight && !!value;

  const tokens = useMemo(() => {
    if (!showOverlay) return [];
    try {
      return tokenizeGDL(value) as Array<{ type: TokenType; value: string }>;
    } catch {
      return [{ type: 'error' as const, value }];
    }
  }, [showOverlay, value]);

  const syncScroll = useCallback(() => {
    if (inputRef.current && overlayRef.current) {
      overlayRef.current.scrollLeft = inputRef.current.scrollLeft;
    }
  }, []);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.addEventListener('scroll', syncScroll);
    return () => input.removeEventListener('scroll', syncScroll);
  }, [syncScroll]);

  return (
    <div className='relative'>
      {showOverlay && (
        <div
          ref={overlayRef}
          aria-hidden='true'
          className={cn(
            'pointer-events-none absolute inset-0 flex h-10 items-center overflow-hidden whitespace-pre rounded-input border border-transparent px-4 py-2 text-sm',
            className
          )}
        >
          {tokens.map((token, i) => {
            if (token.type === 'separator') {
              return (
                <span key={i} className='text-muted-foreground'>
                  {token.value}
                </span>
              );
            }

            if (token.type === 'error') {
              return (
                <span
                  key={i}
                  style={{
                    color: TOKEN_STYLES.error,
                    textDecoration: 'underline',
                  }}
                >
                  {token.value}
                </span>
              );
            }

            const color = TOKEN_STYLES[token.type];
            if (color) {
              return (
                <span key={i} style={{ color }}>
                  {token.value}
                </span>
              );
            }

            return <span key={i}>{token.value}</span>;
          })}
        </div>
      )}

      <input
        ref={inputRef}
        type='text'
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full rounded-input border border-input bg-background px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 caret-foreground',
          rainbowFocus && 'smart-date-rainbow-input',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          showOverlay && 'text-transparent',
          className
        )}
      />
    </div>
  );
}
