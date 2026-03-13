'use client';

import { useSearchParams } from 'next/navigation';
import { DataExplorer, type DetailTarget } from './components/data-explorer';

export default function ExplorerPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  const initialTarget: DetailTarget | undefined =
    type && id && (type === 'user' || type === 'event' || type === 'post')
      ? { type, id }
      : undefined;

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Data Explorer</h1>
        <p className='text-muted-foreground'>
          Browse and explore all entities in the database with clickable
          relations.
        </p>
      </div>
      <DataExplorer initialTarget={initialTarget} />
    </div>
  );
}
