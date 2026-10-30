import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Document rank is independent of visual emphasis. */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  roleSize?: 'page' | 'section' | 'content';
}

/** Responsive typography roles using Groupi's established heading family. */
export function Heading({
  level = 2,
  roleSize = 'section',
  className,
  ...props
}: HeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag
      className={cn(
        'font-heading font-semibold tracking-tight break-words',
        {
          'text-3xl sm:text-4xl leading-tight': roleSize === 'page',
          'text-2xl leading-snug': roleSize === 'section',
          'text-lg leading-snug': roleSize === 'content',
        },
        className
      )}
      {...props}
    />
  );
}
