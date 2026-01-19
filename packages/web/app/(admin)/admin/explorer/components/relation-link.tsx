'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RelationLinkProps {
  count: number;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}

export function RelationLink({ count, label, onClick, className }: RelationLinkProps) {
  if (count === 0) {
    return <span className="text-muted-foreground text-sm">0 {label}</span>;
  }

  return (
    <Button
      variant="link"
      size="sm"
      className={cn('h-auto p-0 text-primary', className)}
      onClick={onClick}
    >
      {count} {label}
    </Button>
  );
}
