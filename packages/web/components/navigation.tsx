import Link from 'next/link';
import { MobileNav } from './mobile-nav';
import { NotificationsDesktop } from './notifications-desktop';
import { ProfileDropdown } from './profile-dropdown';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
  AdminOnly,
} from '@/components/auth/auth-wrappers';
import { useGlobalUser } from '@/context/global-user-context';
import { isAdminRole } from '@/lib/constants';

/**
 * Main navigation bar using Convex authentication components
 * Wrapped in Suspense in the layout
 */

type NavItem = {
  href: string;
  title: string;
  disabled?: boolean;
};

export function Navigation({ items }: { items: NavItem[] }) {
  return (
    <>
      <Authenticated>
        <MobileNavigation items={items} />
      </Authenticated>

      <Unauthenticated>
        <MobileNav
          userInfo={{
            name: undefined,
            email: '',
            image: undefined,
            username: undefined,
          }}
          items={[]}
        />
      </Unauthenticated>

      <div className='ml-auto'>
        <Authenticated>
          <div className='hidden md:block'>
            <div className='flex items-center gap-3'>
              <Button variant='outline-primary' size='sm' asChild>
                <Link href='/create'>
                  <Icons.plus className='size-4' />
                  <span>Create</span>
                </Link>
              </Button>
              <AdminOnly fallback={null}>
                <Link
                  href='/admin'
                  className='flex items-center gap-1.5 h-9 px-3 text-sm font-medium rounded-button transition-colors hover:bg-accent hover:text-accent-foreground'
                >
                  <Icons.shield className='size-4' />
                  <span>Admin</span>
                </Link>
              </AdminOnly>
              <NotificationsDesktop />
              <UserProfile />
            </div>
          </div>
        </Authenticated>

        <Unauthenticated>
          <Link
            href='/sign-in'
            className='hidden md:flex items-center gap-2 h-10 px-4 text-sm font-semibold rounded-button transition-all duration-fast hover:bg-accent hover:text-accent-foreground'
          >
            Sign In
            <Icons.signIn className='size-5' />
          </Link>
        </Unauthenticated>

        <AuthLoading>
          <div className='hidden md:block'>
            <Skeleton className='h-10 w-24 rounded-button' />
          </div>
        </AuthLoading>
      </div>
    </>
  );
}

function MobileNavigation({ items }: { items?: NavItem[] }) {
  // Use global user context instead of direct query
  const { user } = useGlobalUser();

  if (!user) {
    return (
      <MobileNav
        userInfo={{
          name: undefined,
          email: '',
          image: undefined,
          username: undefined,
        }}
        items={[]}
      />
    );
  }

  // Filter out admin items - admin link is shown in profile section
  const publicItems = items?.filter(item => item.href !== '/admin') || [];

  return (
    <MobileNav
      userInfo={{
        name: user.name || undefined,
        email: user.email,
        image: user.image || undefined,
        username: user.username || undefined,
      }}
      items={publicItems}
      isAdmin={isAdminRole(user.role)}
    />
  );
}

function UserProfile() {
  // Use global user context instead of direct query
  const { userAndPerson, isLoading, user } = useGlobalUser();

  // Loading state - show spinner
  if (isLoading || userAndPerson === undefined) {
    return (
      <div className='animate-spin h-6 w-6 border-2 border-border border-t-foreground rounded-full'></div>
    );
  }

  // User authenticated but no person record - redirect will happen via OnboardingRedirectWrapper
  // Show minimal profile in the meantime
  if (userAndPerson === null || !user) {
    return (
      <ProfileDropdown
        userInfo={{
          name: undefined,
          email: 'Loading...',
          image: undefined,
          username: undefined,
        }}
      />
    );
  }

  return (
    <ProfileDropdown
      userInfo={{
        name: user.name || undefined,
        email: user.email,
        image: user.image || undefined,
        username: user.username || undefined,
      }}
    />
  );
}
