import React from 'react';
import { Badge } from '@/components/ui/badge';

export function NumberBadge({
  num,
  children,
}: {
  num: number;
  children: React.ReactNode;
}) {
  return (
    <span className='relative inline-block'>
      {children}
      <Badge
        variant='destructive'
        className='absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 px-2 py-1 font-bold leading-none'
      >
        {num}
      </Badge>
    </span>
  );
}
