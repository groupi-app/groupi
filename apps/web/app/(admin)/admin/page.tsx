import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@groupi/services';
import { AdminDashboard } from './components/admin-dashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
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

  return (
    <div className='container mx-auto py-8'>
      <AdminDashboard />
    </div>
  );
}
