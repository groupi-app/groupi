'use client';

import { QueryBuilder } from './components/query-builder';

export default function QueryBuilderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Query Builder</h1>
        <p className="text-muted-foreground">
          Build complex queries with filters, sorting, and relationship conditions.
        </p>
      </div>
      <QueryBuilder />
    </div>
  );
}
