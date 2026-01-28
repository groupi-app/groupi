'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { RelationLink } from './relation-link';
import type { EntityType, DetailTarget } from './data-explorer';
import { formatDistanceToNow } from 'date-fns';

interface EntityTableProps {
  entityType: EntityType;
  data: Record<string, unknown>[];
  isLoading: boolean;
  sortField?: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  onRelationClick: (target: DetailTarget, label: string) => void;
  hasMore: boolean;
  onLoadMore: () => void;
}

function SortableHeader({
  field,
  label,
  currentField,
  direction,
  onSort,
}: {
  field: string;
  label: string;
  currentField?: string;
  direction: 'asc' | 'desc';
  onSort: (field: string) => void;
}) {
  const isActive = currentField === field;
  return (
    <TableHead
      className='cursor-pointer hover:bg-muted/50 select-none'
      onClick={() => onSort(field)}
    >
      <div className='flex items-center gap-1'>
        {label}
        {isActive && (
          <span className='ml-1'>
            {direction === 'asc' ? (
              <Icons.up className='h-3 w-3' />
            ) : (
              <Icons.down className='h-3 w-3' />
            )}
          </span>
        )}
      </div>
    </TableHead>
  );
}

function formatDate(timestamp: number | null | undefined): string {
  if (!timestamp) return '-';
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function truncate(
  text: string | null | undefined,
  maxLength: number = 50
): string {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function EntityTable({
  entityType,
  data,
  isLoading,
  sortField,
  sortDirection,
  onSort,
  onRelationClick,
  hasMore,
  onLoadMore,
}: EntityTableProps) {
  if (isLoading) {
    return <TableSkeleton entityType={entityType} />;
  }

  if (data.length === 0) {
    return (
      <div className='text-center py-12 text-muted-foreground'>
        No {entityType} found.
      </div>
    );
  }

  const renderTable = () => {
    switch (entityType) {
      case 'users':
        return (
          <UsersTable
            data={data}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
            onRelationClick={onRelationClick}
          />
        );
      case 'events':
        return (
          <EventsTable
            data={data}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
            onRelationClick={onRelationClick}
          />
        );
      case 'posts':
        return (
          <PostsTable
            data={data}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
            onRelationClick={onRelationClick}
          />
        );
      case 'replies':
        return (
          <RepliesTable
            data={data}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
            onRelationClick={onRelationClick}
          />
        );
      case 'memberships':
        return (
          <MembershipsTable
            data={data}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
            onRelationClick={onRelationClick}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className='space-y-4'>
      <div className='rounded-md border overflow-hidden'>{renderTable()}</div>
      {hasMore && (
        <div className='flex justify-center'>
          <Button variant='outline' onClick={onLoadMore}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}

// Users Table
function UsersTable({
  data,
  sortField,
  sortDirection,
  onSort,
  onRelationClick,
}: {
  data: Record<string, unknown>[];
  sortField?: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  onRelationClick: (target: DetailTarget, label: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <SortableHeader
            field='email'
            label='Email'
            currentField={sortField}
            direction={sortDirection}
            onSort={onSort}
          />
          <SortableHeader
            field='role'
            label='Role'
            currentField={sortField}
            direction={sortDirection}
            onSort={onSort}
          />
          <TableHead>Events</TableHead>
          <SortableHeader
            field='createdAt'
            label='Joined'
            currentField={sortField}
            direction={sortDirection}
            onSort={onSort}
          />
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((user: Record<string, unknown>) => (
          <TableRow
            key={user.personId as string}
            className='cursor-pointer hover:bg-muted/50'
            onClick={() =>
              onRelationClick(
                { type: 'user', id: user.personId as string },
                (user.name as string) || (user.email as string) || 'User'
              )
            }
          >
            <TableCell>
              <div className='flex items-center gap-3'>
                <Avatar className='h-8 w-8'>
                  <AvatarImage src={(user.image as string) || undefined} />
                  <AvatarFallback>
                    {getInitials(user.name as string)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className='font-medium'>
                    {(user.name as string) || 'No name'}
                  </div>
                  {user.username ? (
                    <div className='text-sm text-muted-foreground'>
                      @{String(user.username)}
                    </div>
                  ) : null}
                </div>
              </div>
            </TableCell>
            <TableCell className='text-sm'>{user.email as string}</TableCell>
            <TableCell>
              <Badge
                variant={
                  (user.role as string) === 'admin' ? 'default' : 'secondary'
                }
              >
                {(user.role as string) || 'user'}
              </Badge>
            </TableCell>
            <TableCell>
              <RelationLink
                count={
                  (user._count as Record<string, number>)?.memberships || 0
                }
                label='events'
                onClick={e => {
                  e.stopPropagation();
                  onRelationClick(
                    { type: 'user', id: user.personId as string },
                    `${(user.name as string) || 'User'}'s events`
                  );
                }}
              />
            </TableCell>
            <TableCell className='text-sm text-muted-foreground'>
              {formatDate(user.createdAt as number)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Events Table
function EventsTable({
  data,
  sortField,
  sortDirection,
  onSort,
  onRelationClick,
}: {
  data: Record<string, unknown>[];
  sortField?: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  onRelationClick: (target: DetailTarget, label: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHeader
            field='title'
            label='Title'
            currentField={sortField}
            direction={sortDirection}
            onSort={onSort}
          />
          <TableHead>Organizer</TableHead>
          <TableHead>Members</TableHead>
          <TableHead>Posts</TableHead>
          <SortableHeader
            field='createdAt'
            label='Created'
            currentField={sortField}
            direction={sortDirection}
            onSort={onSort}
          />
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((event: Record<string, unknown>) => (
          <TableRow
            key={event.id as string}
            className='cursor-pointer hover:bg-muted/50'
            onClick={() =>
              onRelationClick(
                { type: 'event', id: event.id as string },
                (event.title as string) || 'Event'
              )
            }
          >
            <TableCell>
              <div>
                <div className='font-medium'>{event.title as string}</div>
                {event.location ? (
                  <div className='text-sm text-muted-foreground flex items-center gap-1'>
                    <Icons.location className='h-3 w-3' />
                    {String(truncate(event.location as string, 30))}
                  </div>
                ) : null}
              </div>
            </TableCell>
            <TableCell className='text-sm'>
              {(event.organizer as Record<string, string>)?.name ||
                (event.organizer as Record<string, string>)?.email ||
                '-'}
            </TableCell>
            <TableCell>
              <RelationLink
                count={
                  (event._count as Record<string, number>)?.memberships || 0
                }
                label='members'
                onClick={e => {
                  e.stopPropagation();
                  onRelationClick(
                    { type: 'event', id: event.id as string },
                    `${event.title as string} members`
                  );
                }}
              />
            </TableCell>
            <TableCell>
              <RelationLink
                count={(event._count as Record<string, number>)?.posts || 0}
                label='posts'
                onClick={e => {
                  e.stopPropagation();
                  onRelationClick(
                    { type: 'event', id: event.id as string },
                    `${event.title as string} posts`
                  );
                }}
              />
            </TableCell>
            <TableCell className='text-sm text-muted-foreground'>
              {formatDate(event.createdAt as number)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Posts Table
function PostsTable({
  data,
  sortField,
  sortDirection,
  onSort,
  onRelationClick,
}: {
  data: Record<string, unknown>[];
  sortField?: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  onRelationClick: (target: DetailTarget, label: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHeader
            field='title'
            label='Title'
            currentField={sortField}
            direction={sortDirection}
            onSort={onSort}
          />
          <TableHead>Author</TableHead>
          <TableHead>Event</TableHead>
          <TableHead>Replies</TableHead>
          <SortableHeader
            field='createdAt'
            label='Created'
            currentField={sortField}
            direction={sortDirection}
            onSort={onSort}
          />
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((post: Record<string, unknown>) => (
          <TableRow
            key={post.id as string}
            className='cursor-pointer hover:bg-muted/50'
            onClick={() =>
              onRelationClick(
                { type: 'post', id: post.id as string },
                (post.title as string) || 'Post'
              )
            }
          >
            <TableCell>
              <div className='font-medium'>
                {truncate(post.title as string, 40)}
              </div>
            </TableCell>
            <TableCell className='text-sm'>
              <button
                className='text-primary hover:underline'
                onClick={e => {
                  e.stopPropagation();
                  onRelationClick(
                    { type: 'user', id: post.authorId as string },
                    (post.author as Record<string, string>)?.name || 'Author'
                  );
                }}
              >
                {(post.author as Record<string, string>)?.name ||
                  (post.author as Record<string, string>)?.email ||
                  '-'}
              </button>
            </TableCell>
            <TableCell className='text-sm'>
              <button
                className='text-primary hover:underline'
                onClick={e => {
                  e.stopPropagation();
                  onRelationClick(
                    { type: 'event', id: post.eventId as string },
                    (post.event as Record<string, string>)?.title || 'Event'
                  );
                }}
              >
                {truncate((post.event as Record<string, string>)?.title, 25)}
              </button>
            </TableCell>
            <TableCell>
              <RelationLink
                count={(post._count as Record<string, number>)?.replies || 0}
                label='replies'
                onClick={e => {
                  e.stopPropagation();
                  onRelationClick(
                    { type: 'post', id: post.id as string },
                    `${post.title as string} replies`
                  );
                }}
              />
            </TableCell>
            <TableCell className='text-sm text-muted-foreground'>
              {formatDate(post.createdAt as number)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Replies Table
function RepliesTable({
  data,
  sortField,
  sortDirection,
  onSort,
  onRelationClick,
}: {
  data: Record<string, unknown>[];
  sortField?: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  onRelationClick: (target: DetailTarget, label: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHeader
            field='text'
            label='Content'
            currentField={sortField}
            direction={sortDirection}
            onSort={onSort}
          />
          <TableHead>Author</TableHead>
          <TableHead>Post</TableHead>
          <TableHead>Event</TableHead>
          <SortableHeader
            field='createdAt'
            label='Created'
            currentField={sortField}
            direction={sortDirection}
            onSort={onSort}
          />
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((reply: Record<string, unknown>) => (
          <TableRow key={reply.id as string}>
            <TableCell>
              <div className='max-w-[300px] truncate'>
                {truncate(
                  (reply.text as string) || (reply.content as string),
                  50
                )}
              </div>
            </TableCell>
            <TableCell className='text-sm'>
              <button
                className='text-primary hover:underline'
                onClick={() =>
                  onRelationClick(
                    { type: 'user', id: reply.authorId as string },
                    (reply.author as Record<string, string>)?.name || 'Author'
                  )
                }
              >
                {(reply.author as Record<string, string>)?.name ||
                  (reply.author as Record<string, string>)?.email ||
                  '-'}
              </button>
            </TableCell>
            <TableCell className='text-sm'>
              <button
                className='text-primary hover:underline'
                onClick={() =>
                  onRelationClick(
                    { type: 'post', id: reply.postId as string },
                    (reply.post as Record<string, string>)?.title || 'Post'
                  )
                }
              >
                {truncate((reply.post as Record<string, string>)?.title, 25)}
              </button>
            </TableCell>
            <TableCell className='text-sm'>
              {(reply.post as Record<string, Record<string, string>>)?.event
                ?.title || '-'}
            </TableCell>
            <TableCell className='text-sm text-muted-foreground'>
              {formatDate(reply.createdAt as number)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Memberships Table
function MembershipsTable({
  data,
  sortField,
  sortDirection,
  onSort,
  onRelationClick,
}: {
  data: Record<string, unknown>[];
  sortField?: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  onRelationClick: (target: DetailTarget, label: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Person</TableHead>
          <TableHead>Event</TableHead>
          <SortableHeader
            field='role'
            label='Role'
            currentField={sortField}
            direction={sortDirection}
            onSort={onSort}
          />
          <SortableHeader
            field='rsvpStatus'
            label='RSVP'
            currentField={sortField}
            direction={sortDirection}
            onSort={onSort}
          />
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((membership: Record<string, unknown>) => (
          <TableRow key={membership.id as string}>
            <TableCell className='text-sm'>
              <button
                className='text-primary hover:underline'
                onClick={() =>
                  onRelationClick(
                    { type: 'user', id: membership.personId as string },
                    (membership.person as Record<string, string>)?.name ||
                      'Person'
                  )
                }
              >
                {(membership.person as Record<string, string>)?.name ||
                  (membership.person as Record<string, string>)?.email ||
                  '-'}
              </button>
            </TableCell>
            <TableCell className='text-sm'>
              <button
                className='text-primary hover:underline'
                onClick={() =>
                  onRelationClick(
                    { type: 'event', id: membership.eventId as string },
                    (membership.event as Record<string, string>)?.title ||
                      'Event'
                  )
                }
              >
                {truncate(
                  (membership.event as Record<string, string>)?.title,
                  30
                )}
              </button>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  (membership.role as string) === 'ORGANIZER'
                    ? 'default'
                    : (membership.role as string) === 'MODERATOR'
                      ? 'secondary'
                      : 'outline'
                }
              >
                {membership.role as string}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  (membership.rsvpStatus as string) === 'YES'
                    ? 'default'
                    : (membership.rsvpStatus as string) === 'MAYBE'
                      ? 'secondary'
                      : 'outline'
                }
              >
                {membership.rsvpStatus as string}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Table Skeleton
function TableSkeleton({ entityType }: { entityType: EntityType }) {
  const columnCount = entityType === 'memberships' ? 4 : 5;
  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columnCount }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className='h-4 w-24' />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: columnCount }).map((_, j) => (
                <TableCell key={j}>
                  <Skeleton className='h-4 w-full' />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
