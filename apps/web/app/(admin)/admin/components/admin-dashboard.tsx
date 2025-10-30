'use client';

import { useState } from 'react';
import { trpc } from '@/lib/utils/api';
import { UserList } from './user-list';
import { EventList } from './event-list';
import { PostList } from './post-list';
import { ReplyList } from './reply-list';
import { EditUserDialog } from './edit-user-dialog';
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
import type { UserAdminListItemDTO } from '@groupi/schema';

export function AdminDashboard() {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAdminListItemDTO | null>(
    null
  );

  // Fetch all data
  const {
    data: usersResult,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = trpc.person.listAll.useQuery();
  const users = usersResult?.[1];

  const { data: eventsResult, refetch: refetchEvents } =
    trpc.event.listAll.useQuery({ limit: 1 });
  const totalEvents = eventsResult?.[1]?.totalCount || 0;

  const { data: postsResult, refetch: refetchPosts } =
    trpc.post.listAll.useQuery({ limit: 1 });
  const totalPosts = postsResult?.[1]?.totalCount || 0;

  const { data: repliesResult, refetch: refetchReplies } =
    trpc.reply.listAll.useQuery({ limit: 1 });
  const totalReplies = repliesResult?.[1]?.totalCount || 0;

  const handleEditUser = (user: UserAdminListItemDTO) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleCloseEdit = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
  };

  const handleRefreshAll = () => {
    refetchUsers();
    refetchEvents();
    refetchPosts();
    refetchReplies();
  };

  const totalUsers = users?.length || 0;
  const totalActivity = totalEvents + totalPosts + totalReplies;

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Admin Dashboard</h1>
        <p className='text-muted-foreground'>
          Manage users and monitor platform activity
        </p>
      </div>

      {/* Stats Cards */}
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
            <CardTitle className='text-sm font-medium'>
              Total Activity
            </CardTitle>
            <Activity className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalActivity}</div>
            <p className='text-xs text-muted-foreground'>All content</p>
          </CardContent>
        </Card>
      </div>

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
              {usersLoading ? (
                <div className='flex items-center justify-center py-8'>
                  <p className='text-muted-foreground'>Loading users...</p>
                </div>
              ) : !users ? (
                <div className='flex items-center justify-center py-8'>
                  <p className='text-destructive'>Error loading users</p>
                </div>
              ) : (
                <UserList
                  onEdit={handleEditUser}
                  onSuccess={handleRefreshAll}
                />
              )}
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
              <EventList onSuccess={handleRefreshAll} />
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
              <PostList onSuccess={handleRefreshAll} />
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
              <ReplyList onSuccess={handleRefreshAll} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {selectedUser && (
        <EditUserDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          user={selectedUser}
          onSuccess={handleRefreshAll}
          onClose={handleCloseEdit}
        />
      )}
    </div>
  );
}
