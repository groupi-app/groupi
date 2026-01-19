'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { QueryState } from './query-builder';

interface QueryPreviewProps {
  queryState: QueryState;
}

const entityLabels: Record<string, string> = {
  users: 'Users',
  events: 'Events',
  posts: 'Posts',
  replies: 'Replies',
  memberships: 'Memberships',
};

const operatorLabels: Record<string, string> = {
  equals: '=',
  not_equals: '!=',
  contains: 'contains',
  not_contains: 'not contains',
  starts_with: 'starts with',
  ends_with: 'ends with',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
  is: 'is',
  is_not: "isn't",
};

export function QueryPreview({ queryState }: QueryPreviewProps) {
  const buildQueryDescription = () => {
    const parts: string[] = [];

    // Entity
    parts.push(`SELECT ${entityLabels[queryState.entity]}`);

    // Filters
    if (queryState.filterGroups.length > 0) {
      const filterDescriptions = queryState.filterGroups.map(group => {
        const conditions = group.conditions.map(c => {
          const op = operatorLabels[c.operator] || c.operator;
          if (['is_empty', 'is_not_empty'].includes(c.operator)) {
            return `${c.field} ${op}`;
          }
          // Use valueLabel for relationship filters if available
          const displayValue = c.valueLabel || c.value;
          // For relationship fields, show a friendlier label
          const fieldLabel = c.field.startsWith('rel_')
            ? c.field.replace('rel_', '').replace(/([A-Z])/g, ' $1').toLowerCase()
            : c.field;
          return `${fieldLabel} ${op} "${displayValue}"`;
        });
        return `(${conditions.join(` ${group.logic} `)})`;
      });
      parts.push(`WHERE ${filterDescriptions.join(' AND ')}`);
    }

    // Sort
    if (queryState.sortField) {
      parts.push(
        `ORDER BY ${queryState.sortField} ${queryState.sortDirection.toUpperCase()}`
      );
    }

    return parts;
  };

  const queryLines = buildQueryDescription();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Query Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted rounded-md p-4 font-mono text-sm space-y-1">
          {queryLines.map((line, index) => (
            <div key={index} className="text-muted-foreground">
              {line}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
