'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { formatDistanceToNow } from 'date-fns';
import type { EntityType } from './query-builder';

interface ResultsPanelProps {
  entity: EntityType;
  results: Record<string, unknown>[];
  totalCount: number;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

function formatDate(timestamp: number | null | undefined): string {
  if (!timestamp) return '-';
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

function truncate(
  text: string | null | undefined,
  maxLength: number = 50
): string {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function ResultsPanel({
  entity,
  results,
  totalCount,
  hasMore,
  isLoading,
  onLoadMore,
}: ResultsPanelProps) {
  const handleExportCsv = () => {
    if (results.length === 0) return;

    // Get all keys from the first result
    const keys = Object.keys(results[0]);

    // Build CSV content
    const csvLines: string[] = [];

    // Header row
    csvLines.push(keys.join(','));

    // Data rows
    results.forEach(row => {
      const values = keys.map(key => {
        const value = row[key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object')
          return JSON.stringify(value).replace(/"/g, '""');
        return String(value).replace(/"/g, '""');
      });
      csvLines.push(values.map(v => `"${v}"`).join(','));
    });

    // Create and download file
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entity}-export-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className='flex items-center gap-4'>
                <Skeleton className='h-4 w-1/4' />
                <Skeleton className='h-4 w-1/4' />
                <Skeleton className='h-4 w-1/4' />
                <Skeleton className='h-4 w-1/4' />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-12 text-muted-foreground'>
            No results found matching your query.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0'>
        <CardTitle className='text-lg'>Results ({totalCount} total)</CardTitle>
        <Button variant='outline' size='sm' onClick={handleExportCsv}>
          <Icons.download className='h-4 w-4 mr-2' />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className='rounded-md border overflow-hidden'>
          <ResultsTable entity={entity} results={results} />
        </div>
        {hasMore && (
          <div className='flex justify-center mt-4'>
            <Button variant='outline' onClick={onLoadMore}>
              Load More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ResultsTable({
  entity,
  results,
}: {
  entity: EntityType;
  results: Record<string, unknown>[];
}) {
  switch (entity) {
    case 'users':
      return <UsersResults results={results} />;
    case 'events':
      return <EventsResults results={results} />;
    case 'posts':
      return <PostsResults results={results} />;
    case 'replies':
      return <RepliesResults results={results} />;
    case 'memberships':
      return <MembershipsResults results={results} />;
    default:
      return null;
  }
}

function UsersResults({ results }: { results: Record<string, unknown>[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Username</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Events</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((row, i) => (
          <TableRow key={i}>
            <TableCell className='font-medium'>
              {(row.name as string) || '-'}
            </TableCell>
            <TableCell>{row.email as string}</TableCell>
            <TableCell>{(row.username as string) || '-'}</TableCell>
            <TableCell>
              <Badge
                variant={
                  (row.role as string) === 'admin' ? 'default' : 'secondary'
                }
              >
                {(row.role as string) || 'user'}
              </Badge>
            </TableCell>
            <TableCell>{row.membershipCount as number}</TableCell>
            <TableCell className='text-muted-foreground'>
              {formatDate(row.createdAt as number)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function EventsResults({ results }: { results: Record<string, unknown>[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Creator</TableHead>
          <TableHead>Members</TableHead>
          <TableHead>Posts</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((row, i) => (
          <TableRow key={i}>
            <TableCell className='font-medium'>
              {truncate(row.title as string, 40)}
            </TableCell>
            <TableCell>{truncate(row.location as string, 25)}</TableCell>
            <TableCell>
              {(row.creatorName as string) ||
                (row.creatorEmail as string) ||
                '-'}
            </TableCell>
            <TableCell>{row.memberCount as number}</TableCell>
            <TableCell>{row.postCount as number}</TableCell>
            <TableCell className='text-muted-foreground'>
              {formatDate(row.createdAt as number)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PostsResults({ results }: { results: Record<string, unknown>[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Author</TableHead>
          <TableHead>Event</TableHead>
          <TableHead>Replies</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((row, i) => (
          <TableRow key={i}>
            <TableCell className='font-medium'>
              {truncate(row.title as string, 40)}
            </TableCell>
            <TableCell>
              {(row.authorName as string) || (row.authorEmail as string) || '-'}
            </TableCell>
            <TableCell>{truncate(row.eventTitle as string, 25)}</TableCell>
            <TableCell>{row.replyCount as number}</TableCell>
            <TableCell className='text-muted-foreground'>
              {formatDate(row.createdAt as number)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function RepliesResults({ results }: { results: Record<string, unknown>[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Content</TableHead>
          <TableHead>Author</TableHead>
          <TableHead>Post</TableHead>
          <TableHead>Event</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((row, i) => (
          <TableRow key={i}>
            <TableCell className='max-w-[200px]'>
              {truncate(row.text as string, 50)}
            </TableCell>
            <TableCell>
              {(row.authorName as string) || (row.authorEmail as string) || '-'}
            </TableCell>
            <TableCell>{truncate(row.postTitle as string, 25)}</TableCell>
            <TableCell>{truncate(row.eventTitle as string, 25)}</TableCell>
            <TableCell className='text-muted-foreground'>
              {formatDate(row.createdAt as number)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function MembershipsResults({
  results,
}: {
  results: Record<string, unknown>[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Person</TableHead>
          <TableHead>Event</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>RSVP</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((row, i) => (
          <TableRow key={i}>
            <TableCell>
              {(row.personName as string) || (row.personEmail as string) || '-'}
            </TableCell>
            <TableCell>{truncate(row.eventTitle as string, 30)}</TableCell>
            <TableCell>
              <Badge
                variant={
                  (row.role as string) === 'ORGANIZER'
                    ? 'default'
                    : (row.role as string) === 'MODERATOR'
                      ? 'secondary'
                      : 'outline'
                }
              >
                {row.role as string}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  (row.rsvpStatus as string) === 'YES'
                    ? 'default'
                    : (row.rsvpStatus as string) === 'MAYBE'
                      ? 'secondary'
                      : 'outline'
                }
              >
                {row.rsvpStatus as string}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
