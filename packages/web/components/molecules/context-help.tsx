'use client';
import type { ReactNode } from 'react';
import { CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function ContextHelp({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='size-7 shrink-0 text-muted-foreground'
          aria-label={label}
        >
          <CircleHelp className='size-4' aria-hidden='true' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        aria-label={label}
        className='text-sm leading-relaxed text-muted-foreground'
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
