'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AdminOnly } from '@/components/auth/auth-wrappers';

const adminNavItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: Icons.layoutDashboard,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Icons.users,
  },
  {
    title: 'Reports',
    href: '/admin/reports',
    icon: Icons.flag,
  },
  {
    title: 'Explorer',
    href: '/admin/explorer',
    icon: Icons.search,
  },
  {
    title: 'Query Builder',
    href: '/admin/query-builder',
    icon: Icons.code,
  },
];

function LoadingState() {
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <Icons.spinner className='h-8 w-8 animate-spin text-muted-foreground' />
    </div>
  );
}

function RedirectToSignIn() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/sign-in');
  }, [router]);
  return <LoadingState />;
}

function RedirectToEvents() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/events');
  }, [router]);
  return <LoadingState />;
}

function AdminContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className='flex min-h-screen'>
      {/* Sidebar */}
      <aside className='w-64 border-r bg-muted/30 flex flex-col'>
        <div className='p-6 border-b'>
          <Link href='/admin' className='flex items-center gap-2'>
            <Icons.shield className='h-6 w-6 text-primary' />
            <span className='font-bold text-lg'>Admin Panel</span>
          </Link>
        </div>

        <nav className='flex-1 p-4 space-y-1'>
          {adminNavItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className='h-4 w-4' />
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className='p-4 border-t'>
          <Link href='/events'>
            <Button variant='outline' className='w-full'>
              <Icons.arrowLeft className='h-4 w-4 mr-2' />
              Back to App
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className='flex-1 overflow-auto'>
        <div className='container py-6'>{children}</div>
      </main>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Show loading while Convex auth is initializing */}
      <AuthLoading>
        <LoadingState />
      </AuthLoading>

      {/* Redirect to sign-in if not authenticated */}
      <Unauthenticated>
        <RedirectToSignIn />
      </Unauthenticated>

      {/* Show admin content only if authenticated AND admin */}
      <Authenticated>
        <AdminOnly fallback={<RedirectToEvents />}>
          <AdminContent>{children}</AdminContent>
        </AdminOnly>
      </Authenticated>
    </>
  );
}
