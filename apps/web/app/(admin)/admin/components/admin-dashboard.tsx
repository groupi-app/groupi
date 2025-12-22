import { Suspense } from 'react';
import { UserListServer } from './user-list-server';
import { EventListServer } from './event-list-server';
import { PostListServer } from './post-list-server';
import { ReplyListServer } from './reply-list-server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Activity,
  Calendar,
  MessageSquare,
  MessageCircle,
} from 'lucide-react';
import {
  getAllUsersAction,
  getAllEventsAction,
  getAllPostsAction,
  getAllRepliesAction,
} from '@/actions/admin-actions';

// Cache components for data fetching
async function AdminStats() {
  const [, users] = await getAllUsersAction();
  const [, eventsResult] = await getAllEventsAction({ limit: 1 });
  const [, postsResult] = await getAllPostsAction({ limit: 1 });
  const [, repliesResult] = await getAllRepliesAction({ limit: 1 });

  const totalUsers = users?.length || 0;
  const totalEvents = eventsResult?.totalCount || 0;
  const totalPosts = postsResult?.totalCount || 0;
  const totalReplies = repliesResult?.totalCount || 0;
  const totalActivity = totalEvents + totalPosts + totalReplies;

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Users</CardTitle>
          <Users className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{totalUsers}</div>
          <p className='text-xs text-muted-foreground'>Registered</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Events</CardTitle>
          <Calendar className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{totalEvents}</div>
          <p className='text-xs text-muted-foreground'>Total events</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Posts</CardTitle>
          <MessageSquare className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{totalPosts}</div>
          <p className='text-xs text-muted-foreground'>Total posts</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Replies</CardTitle>
          <MessageCircle className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{totalReplies}</div>
          <p className='text-xs text-muted-foreground'>Total replies</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Activity</CardTitle>
          <Activity className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{totalActivity}</div>
          <p className='text-xs text-muted-foreground'>All content</p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsLoading() {
  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <div className='h-4 w-20 bg-muted animate-pulse rounded' />
            <div className='h-4 w-4 bg-muted animate-pulse rounded' />
          </CardHeader>
          <CardContent>
            <div className='h-8 w-16 bg-muted animate-pulse rounded mb-2' />
            <div className='h-3 w-24 bg-muted animate-pulse rounded' />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ListLoading() {
  return (
    <div className='flex items-center justify-center py-8'>
      <p className='text-muted-foreground'>Loading...</p>
    </div>
  );
}

type AdminDashboardProps = {
  searchParams?: {
    [key: string]: string | undefined;
  };
};

// Client component for tab interactivity
export function AdminDashboard({ searchParams }: AdminDashboardProps) {
  return (
    <div className='space-y-8'>
      {/* Stats Cards */}
      <Suspense fallback={<StatsLoading />}>
        <AdminStats />
      </Suspense>

      {/* Main Content */}
      <Tabs defaultValue='users' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='users'>Users</TabsTrigger>
          <TabsTrigger value='events'>Events</TabsTrigger>
          <TabsTrigger value='posts'>Posts</TabsTrigger>
          <TabsTrigger value='replies'>Replies</TabsTrigger>
        </TabsList>

        <TabsContent value='users' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View and manage all registered users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ListLoading />}>
                <UserListServer />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='events' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Event Management</CardTitle>
              <CardDescription>
                View and manage all events in the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ListLoading />}>
                <EventListServer searchParams={searchParams} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='posts' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Post Management</CardTitle>
              <CardDescription>
                View and manage all posts across all events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ListLoading />}>
                <PostListServer searchParams={searchParams} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='replies' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Reply Management</CardTitle>
              <CardDescription>
                View and manage all replies across all posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ListLoading />}>
                <ReplyListServer searchParams={searchParams} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
