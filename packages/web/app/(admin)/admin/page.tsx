'use client';

import { useQuery } from 'convex/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Icons } from '@/components/icons';

// Dynamic require to avoid deep type instantiation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let adminQueries: any;
function initApi() {
  if (!adminQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require("@/convex/_generated/api");
    adminQueries = api.admin?.queries ?? {};
  }
}
initApi();

export default function AdminDashboardPage() {
  // Fetch summary data for dashboard
  const usersData = useQuery(adminQueries.getUsersAdmin, { limit: 1 });
  const eventsData = useQuery(adminQueries.getEventsAdmin, { limit: 1 });
  const postsData = useQuery(adminQueries.getPostsAdmin, { limit: 1 });
  const repliesData = useQuery(adminQueries.getRepliesAdmin, { limit: 1 });

  const isLoading = !usersData || !eventsData || !postsData || !repliesData;

  const stats = [
    {
      title: 'Total Users',
      value: usersData?.totalCount ?? 0,
      icon: Icons.users,
      description: 'Registered users',
    },
    {
      title: 'Total Events',
      value: eventsData?.totalCount ?? 0,
      icon: Icons.calendar,
      description: 'Created events',
    },
    {
      title: 'Total Posts',
      value: postsData?.totalCount ?? 0,
      icon: Icons.messageSquare,
      description: 'Discussion posts',
    },
    {
      title: 'Total Replies',
      value: repliesData?.totalCount ?? 0,
      icon: Icons.reply,
      description: 'Post replies',
    },
  ];

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Dashboard</h1>
        <p className='text-muted-foreground'>
          Overview of your platform&apos;s activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>
                {stat.title}
              </CardTitle>
              <stat.icon className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className='h-8 w-16 animate-pulse rounded bg-muted' />
              ) : (
                <div className='text-2xl font-bold'>{stat.value.toLocaleString()}</div>
              )}
              <p className='text-xs text-muted-foreground'>{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-2'>
            <a
              href='/admin/users'
              className='flex items-center gap-4 p-4 rounded-lg border hover:bg-muted transition-colors'
            >
              <div className='p-2 rounded-full bg-primary/10'>
                <Icons.users className='h-5 w-5 text-primary' />
              </div>
              <div>
                <p className='font-medium'>Manage Users</p>
                <p className='text-sm text-muted-foreground'>
                  View and manage user accounts
                </p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity - placeholder for future enhancement */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest platform activity</CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>
            Activity feed coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
