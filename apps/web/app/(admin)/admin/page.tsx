import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@groupi/services';
import { AdminDashboard } from './components/admin-dashboard';
import { AdminDashboardSkeleton } from '@/components/skeletons/admin-dashboard-skeleton';
import { Suspense } from 'react';

type PageProps = {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
};

export default async function AdminPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <div className='container mx-auto py-8'>
      <Suspense fallback={<AdminDashboardSkeleton />}>
        <AdminContent searchParams={resolvedSearchParams} />
      </Suspense>
    </div>
  );
}

type AdminContentProps = {
  searchParams?: { [key: string]: string | undefined };
};

async function AdminContent({ searchParams }: AdminContentProps) {
  // Properly validate session on server (not just cookie check)
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/sign-in');
  }

  // Check if user has admin role
  const userRole = session.user.role;
  const isAdmin = userRole?.includes('admin');

  if (!isAdmin) {
    // Redirect non-admin users to home page
    redirect('/');
  }

  return <AdminDashboard searchParams={searchParams} />;
}
