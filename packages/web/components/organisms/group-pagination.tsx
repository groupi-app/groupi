'use client';

import { Button } from '@/components/ui/button';
export function GroupPagination({
  cursor,
  onCursor,
  page,
  label,
}: {
  cursor: string | null;
  onCursor: (cursor: string | null) => void;
  page: { isDone: boolean; continueCursor: string };
  label: string;
}) {
  return (
    <div className='flex gap-2'>
      {cursor !== null && (
        <Button variant='outline' onClick={() => onCursor(null)}>
          First {label} page
        </Button>
      )}
      {!page.isDone && (
        <Button variant='outline' onClick={() => onCursor(page.continueCursor)}>
          Next {label}
        </Button>
      )}
    </div>
  );
}
