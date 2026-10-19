'use client';
import { cn } from '../../utils';
import type { Availability } from '../../content';
export function StatusBadge({ status }: { status: Availability }) {
  return (
    <span
      className={cn('status-badge', status === 'Current' && 'status-current')}
    >
      {status} ·{' '}
      {status === 'Current' ? 'source verified' : 'not a supported quickstart'}
    </span>
  );
}
