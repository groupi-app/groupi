'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import type { DetailTarget, EntityType } from './data-explorer';

export interface BreadcrumbItem {
  label: string;
  target: DetailTarget;
  timestamp: number;
}

interface BreadcrumbTrailProps {
  items: BreadcrumbItem[];
  onNavigate: (index: number) => void;
  entityType: EntityType;
}

const entityLabels: Record<EntityType, string> = {
  users: 'All Users',
  events: 'All Events',
  posts: 'All Posts',
  replies: 'All Replies',
  memberships: 'All Memberships',
};

export function BreadcrumbTrail({
  items,
  onNavigate,
  entityType,
}: BreadcrumbTrailProps) {
  return (
    <nav className='flex items-center gap-1 text-sm mb-4 overflow-x-auto pb-2'>
      <Button
        variant='ghost'
        size='sm'
        className='h-auto py-1 px-2 text-muted-foreground hover:text-foreground'
        onClick={() => onNavigate(-1)}
      >
        {entityLabels[entityType]}
      </Button>

      {items.map((item, index) => (
        <div key={item.timestamp} className='flex items-center gap-1'>
          <Icons.forward className='h-3 w-3 text-muted-foreground flex-shrink-0' />
          <Button
            variant='ghost'
            size='sm'
            className={`h-auto py-1 px-2 ${
              index === items.length - 1
                ? 'text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => onNavigate(index)}
          >
            <span className='max-w-[150px] truncate'>{item.label}</span>
          </Button>
        </div>
      ))}
    </nav>
  );
}
