import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { getSession } from '@groupi/services/server';
import { AdminDashboard } from './components/admin-dashboard';
import { AdminDashboardSkeleton } from '@/components/skeletons/admin-dashboard-skeleton';
import { Suspense } from 'react';

type PageProps = {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
};

export default async function AdminPage({ searchParams }: PageProps) {
  return (
    <div className='container mx-auto py-8'>
      {/* Statically rendered header - no server data needed */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight'>Admin Dashboard</h1>
        <p className='text-muted-foreground'>
          Manage users and monitor platform activity
        </p>
      </div>
      <Suspense fallback={<AdminDashboardSkeleton />}>
        <AdminContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

type AdminContentProps = {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
};

async function AdminContent({ searchParams }: AdminContentProps) {
  const resolvedSearchParams = await searchParams;
  // Explicitly mark as dynamic to prevent prerendering
  await connection();

  // Properly validate session on server (not just cookie check)
  const [error, session] = await getSession();

  if (error || !session) {
    redirect('/sign-in');
  }

  // Check if user has admin role
  const userRole = session.user.role;
  const isAdmin = userRole?.includes('admin');

  if (!isAdmin) {
    // Redirect non-admin users to home page
    redirect('/');
  }

  return <AdminDashboard searchParams={resolvedSearchParams} />;
}
