'use client';

import { useQuery } from 'convex/react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import type { DetailTarget } from './data-explorer';
import { formatDistanceToNow, format } from 'date-fns';
import type { Id } from '@/convex/_generated/dataModel';

// Lazy-load the API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _api: any;
function getApi() {
  if (!_api) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _api = require('@/convex/_generated/api').api;
  }
  return _api;
}

interface EntityDetailPanelProps {
  target: DetailTarget | null;
  onClose: () => void;
  onNavigate: (target: DetailTarget, label: string) => void;
}

function formatDate(timestamp: number | null | undefined): string {
  if (!timestamp) return '-';
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

function formatFullDate(timestamp: number | null | undefined): string {
  if (!timestamp) return '-';
  return format(new Date(timestamp), 'PPpp');
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

export function EntityDetailPanel({ target, onClose, onNavigate }: EntityDetailPanelProps) {
  const api = getApi();

  // Fetch data based on target type
  const userData = useQuery(
    api.admin.explorerQueries.getUserWithRelations,
    target?.type === 'user' ? { personId: target.id as Id<'persons'> } : 'skip'
  );

  const eventData = useQuery(
    api.admin.explorerQueries.getEventWithRelations,
    target?.type === 'event' ? { eventId: target.id as Id<'events'> } : 'skip'
  );

  const postData = useQuery(
    api.admin.explorerQueries.getPostWithRelations,
    target?.type === 'post' ? { postId: target.id as Id<'posts'> } : 'skip'
  );

  const isOpen = target !== null;
  const isLoading =
    (target?.type === 'user' && userData === undefined) ||
    (target?.type === 'event' && eventData === undefined) ||
    (target?.type === 'post' && postData === undefined);

  const renderContent = () => {
    if (!target) return null;

    if (isLoading) {
      return (
        <>
          <VisuallyHidden>
            <SheetTitle>Loading details</SheetTitle>
          </VisuallyHidden>
          <DetailSkeleton />
        </>
      );
    }

    switch (target.type) {
      case 'user':
        return userData ? (
          <UserDetail data={userData} onNavigate={onNavigate} />
        ) : (
          <>
            <VisuallyHidden>
              <SheetTitle>User not found</SheetTitle>
            </VisuallyHidden>
            <div className="text-muted-foreground">User not found</div>
          </>
        );
      case 'event':
        return eventData ? (
          <EventDetail data={eventData} onNavigate={onNavigate} />
        ) : (
          <>
            <VisuallyHidden>
              <SheetTitle>Event not found</SheetTitle>
            </VisuallyHidden>
            <div className="text-muted-foreground">Event not found</div>
          </>
        );
      case 'post':
        return postData ? (
          <PostDetail data={postData} onNavigate={onNavigate} />
        ) : (
          <>
            <VisuallyHidden>
              <SheetTitle>Post not found</SheetTitle>
            </VisuallyHidden>
            <div className="text-muted-foreground">Post not found</div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={open => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {renderContent()}
      </SheetContent>
    </Sheet>
  );
}

// User Detail View
function UserDetail({
  data,
  onNavigate,
}: {
  data: Record<string, unknown>;
  onNavigate: (target: DetailTarget, label: string) => void;
}) {
  const api = getApi();
  const counts = data._count as Record<string, number>;

  // Fetch user's memberships
  const membershipsData = useQuery(api.admin.explorerQueries.getUserMemberships, {
    personId: data.personId as Id<'persons'>,
    limit: 5,
  });

  // Fetch user's posts
  const postsData = useQuery(api.admin.explorerQueries.getUserPostsAcrossEvents, {
    personId: data.personId as Id<'persons'>,
    limit: 5,
  });

  return (
    <div className="space-y-6">
      <SheetHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={(data.image as string) || undefined} />
            <AvatarFallback className="text-lg">
              {getInitials(data.name as string)}
            </AvatarFallback>
          </Avatar>
          <div>
            <SheetTitle className="text-xl">
              {(data.name as string) || 'No name'}
            </SheetTitle>
            <SheetDescription>
              {data.email as string}
              {data.username ? (
                <span className="ml-2 text-muted-foreground">
                  @{String(data.username)}
                </span>
              ) : null}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Events" value={counts?.memberships || 0} />
        <StatCard label="Posts" value={counts?.posts || 0} />
        <StatCard label="Replies" value={counts?.replies || 0} />
      </div>

      {/* Info */}
      <div className="space-y-3">
        <InfoRow label="Role">
          <Badge variant={(data.role as string) === 'admin' ? 'default' : 'secondary'}>
            {(data.role as string) || 'user'}
          </Badge>
        </InfoRow>
        {data.bio ? <InfoRow label="Bio">{String(data.bio)}</InfoRow> : null}
        {data.pronouns ? <InfoRow label="Pronouns">{String(data.pronouns)}</InfoRow> : null}
        <InfoRow label="Joined">{formatFullDate(data.createdAt as number)}</InfoRow>
        {data.lastSeen ? (
          <InfoRow label="Last Seen">{String(formatDate(data.lastSeen as number))}</InfoRow>
        ) : null}
      </div>

      {/* Tabs for related data */}
      <Tabs defaultValue="events" className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="events">Events ({counts?.memberships || 0})</TabsTrigger>
          <TabsTrigger value="posts">Posts ({counts?.posts || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-2 mt-4">
          {membershipsData?.memberships?.map((m: Record<string, unknown>) => (
            <div
              key={m.id as string}
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
              onClick={() =>
                onNavigate(
                  { type: 'event', id: m.eventId as string },
                  ((m.event as Record<string, string>)?.title) || 'Event'
                )
              }
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {((m.event as Record<string, string>)?.title) || 'Unknown Event'}
                </div>
                <Badge variant="outline" className="text-xs">
                  {m.role as string}
                </Badge>
              </div>
              {(m.event as Record<string, unknown>)?.location ? (
                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Icons.location className="h-3 w-3" />
                  {String((m.event as Record<string, string>)?.location)}
                </div>
              ) : null}
            </div>
          ))}
          {(!membershipsData?.memberships || membershipsData.memberships.length === 0) && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No events found
            </div>
          )}
        </TabsContent>

        <TabsContent value="posts" className="space-y-2 mt-4">
          {postsData?.posts?.map((p: Record<string, unknown>) => (
            <div
              key={p.id as string}
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
              onClick={() =>
                onNavigate({ type: 'post', id: p.id as string }, (p.title as string) || 'Post')
              }
            >
              <div className="font-medium">{p.title as string}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                <span>{((p.event as Record<string, string>)?.title) || 'Unknown Event'}</span>
                <span>-</span>
                <span>{formatDate(p.createdAt as number)}</span>
              </div>
            </div>
          ))}
          {(!postsData?.posts || postsData.posts.length === 0) && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No posts found
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Event Detail View
function EventDetail({
  data,
  onNavigate,
}: {
  data: Record<string, unknown>;
  onNavigate: (target: DetailTarget, label: string) => void;
}) {
  const api = getApi();
  const counts = data._count as Record<string, number>;

  // Fetch event members
  const membersData = useQuery(api.admin.explorerQueries.getEventMembers, {
    eventId: data.id as Id<'events'>,
    limit: 5,
  });

  // Fetch event posts
  const postsData = useQuery(api.admin.explorerQueries.getEventPosts, {
    eventId: data.id as Id<'events'>,
    limit: 5,
  });

  return (
    <div className="space-y-6">
      <SheetHeader>
        <SheetTitle className="text-xl">{data.title as string}</SheetTitle>
        <SheetDescription>
          {(data.location as string) || 'No location set'}
        </SheetDescription>
      </SheetHeader>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Members" value={counts?.memberships || 0} />
        <StatCard label="Posts" value={counts?.posts || 0} />
        <StatCard label="Replies" value={counts?.replies || 0} />
      </div>

      {/* Info */}
      <div className="space-y-3">
        {data.description ? (
          <InfoRow label="Description">{String(data.description)}</InfoRow>
        ) : null}
        <InfoRow label="Creator">
          <Button
            variant="link"
            className="h-auto p-0"
            onClick={() =>
              onNavigate(
                { type: 'user', id: data.creatorId as string },
                ((data.creator as Record<string, string>)?.name) || 'Creator'
              )
            }
          >
            {((data.creator as Record<string, string>)?.name) ||
              ((data.creator as Record<string, string>)?.email) ||
              'Unknown'}
          </Button>
        </InfoRow>
        <InfoRow label="Timezone">{String(data.timezone)}</InfoRow>
        {data.chosenDateTime ? (
          <InfoRow label="Event Date">
            {formatFullDate(data.chosenDateTime as number)}
          </InfoRow>
        ) : null}
        <InfoRow label="Created">{formatFullDate(data.createdAt as number)}</InfoRow>
      </div>

      {/* Tabs for related data */}
      <Tabs defaultValue="members" className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members">Members ({counts?.memberships || 0})</TabsTrigger>
          <TabsTrigger value="posts">Posts ({counts?.posts || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-2 mt-4">
          {membersData?.members?.map((m: Record<string, unknown>) => (
            <div
              key={m.id as string}
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
              onClick={() =>
                onNavigate(
                  { type: 'user', id: m.personId as string },
                  ((m.person as Record<string, string>)?.name) || 'Member'
                )
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={((m.person as Record<string, string>)?.image) || undefined}
                    />
                    <AvatarFallback>
                      {getInitials((m.person as Record<string, string>)?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {((m.person as Record<string, string>)?.name) || 'No name'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {((m.person as Record<string, string>)?.email) || ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {m.role as string}
                  </Badge>
                  <Badge
                    variant={
                      (m.rsvpStatus as string) === 'YES'
                        ? 'default'
                        : (m.rsvpStatus as string) === 'MAYBE'
                          ? 'secondary'
                          : 'outline'
                    }
                    className="text-xs"
                  >
                    {m.rsvpStatus as string}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
          {(!membersData?.members || membersData.members.length === 0) && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No members found
            </div>
          )}
        </TabsContent>

        <TabsContent value="posts" className="space-y-2 mt-4">
          {postsData?.posts?.map((p: Record<string, unknown>) => (
            <div
              key={p.id as string}
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
              onClick={() =>
                onNavigate({ type: 'post', id: p.id as string }, (p.title as string) || 'Post')
              }
            >
              <div className="font-medium">{p.title as string}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                <span>
                  by{' '}
                  {((p.author as Record<string, string>)?.name) ||
                    ((p.author as Record<string, string>)?.email) ||
                    'Unknown'}
                </span>
                <span>-</span>
                <span>{formatDate(p.createdAt as number)}</span>
              </div>
            </div>
          ))}
          {(!postsData?.posts || postsData.posts.length === 0) && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No posts found
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Post Detail View
function PostDetail({
  data,
  onNavigate,
}: {
  data: Record<string, unknown>;
  onNavigate: (target: DetailTarget, label: string) => void;
}) {
  const api = getApi();
  const counts = data._count as Record<string, number>;

  // Fetch post replies
  const repliesData = useQuery(api.admin.explorerQueries.getPostReplies, {
    postId: data.id as Id<'posts'>,
    limit: 10,
  });

  return (
    <div className="space-y-6">
      <SheetHeader>
        <SheetTitle className="text-xl">{data.title as string}</SheetTitle>
        <SheetDescription>
          Posted in{' '}
          <Button
            variant="link"
            className="h-auto p-0"
            onClick={() =>
              onNavigate(
                { type: 'event', id: data.eventId as string },
                ((data.event as Record<string, string>)?.title) || 'Event'
              )
            }
          >
            {((data.event as Record<string, string>)?.title) || 'Unknown Event'}
          </Button>
        </SheetDescription>
      </SheetHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Replies" value={counts?.replies || 0} />
      </div>

      {/* Info */}
      <div className="space-y-3">
        <InfoRow label="Author">
          <Button
            variant="link"
            className="h-auto p-0"
            onClick={() =>
              onNavigate(
                { type: 'user', id: data.authorId as string },
                ((data.author as Record<string, string>)?.name) || 'Author'
              )
            }
          >
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={((data.author as Record<string, string>)?.image) || undefined}
                />
                <AvatarFallback>
                  {getInitials((data.author as Record<string, string>)?.name)}
                </AvatarFallback>
              </Avatar>
              {((data.author as Record<string, string>)?.name) ||
                ((data.author as Record<string, string>)?.email) ||
                'Unknown'}
            </div>
          </Button>
        </InfoRow>
        <InfoRow label="Created">{formatFullDate(data.createdAt as number)}</InfoRow>
        {data.editedAt !== data.createdAt && (
          <InfoRow label="Edited">{formatFullDate(data.editedAt as number)}</InfoRow>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground">Content</div>
        <div className="p-4 rounded-lg border bg-muted/30 whitespace-pre-wrap text-sm">
          {data.content as string}
        </div>
      </div>

      {/* Replies */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-muted-foreground">
          Replies ({counts?.replies || 0})
        </div>
        {repliesData?.replies?.map((r: Record<string, unknown>) => (
          <div key={r.id as string} className="p-3 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback>
                  {getInitials((r.author as Record<string, string>)?.name)}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="link"
                className="h-auto p-0 text-sm"
                onClick={() =>
                  onNavigate(
                    { type: 'user', id: r.authorId as string },
                    ((r.author as Record<string, string>)?.name) || 'Author'
                  )
                }
              >
                {((r.author as Record<string, string>)?.name) ||
                  ((r.author as Record<string, string>)?.email) ||
                  'Unknown'}
              </Button>
              <span className="text-xs text-muted-foreground">
                {formatDate(r.createdAt as number)}
              </span>
            </div>
            <div className="text-sm">{r.text as string}</div>
          </div>
        ))}
        {(!repliesData?.replies || repliesData.replies.length === 0) && (
          <div className="text-sm text-muted-foreground text-center py-4">
            No replies yet
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-3 rounded-lg border text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-sm text-muted-foreground min-w-[80px]">{label}:</span>
      <span className="text-sm flex-1">{children}</span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
