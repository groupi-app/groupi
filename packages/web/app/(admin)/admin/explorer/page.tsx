'use client';

import { DataExplorer } from './components/data-explorer';

export default function ExplorerPage() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Data Explorer</h1>
        <p className='text-muted-foreground'>
          Browse and explore all entities in the database with clickable
          relations.
        </p>
      </div>
      <DataExplorer />
    </div>
  );
}
