import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import Link from 'next/link';
import { MobileNav } from './mobile-nav';
import { NotificationsDesktop } from './notifications-desktop';
import { ProfileDropdown } from './profile-dropdown';
import { Icons } from '@/components/icons';
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

// Alias for backwards compatibility
type MainNavItem = NavItem;

export function Navigation({ items }: { items: NavItem[] }) {
  return (
    <>
      <Authenticated>
        <NavigationLinks items={items} />
      </Authenticated>

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
            <div className='animate-spin h-6 w-6 border-2 border-border border-t-foreground rounded-full'></div>
          </div>
        </AuthLoading>
      </div>
    </>
  );
}

function NavigationLinks({ items }: { items?: MainNavItem[] }) {
  // Filter navigation items - admin items will be conditionally shown by AdminOnly wrapper
  const publicItems = items?.filter(item => item.href !== '/admin');
  const adminItems = items?.filter(item => item.href === '/admin');

  return (
    <>
      {publicItems?.length ? (
        <NavigationMenu>
          <NavigationMenuList
            className={'hidden gap-4 font-semibold text-sm md:flex'}
          >
            {publicItems.map((item, i) => (
              <NavigationMenuItem key={i}>
                <NavigationMenuLink
                  className={
                    'px-2 py-2 transition-colors dark:hover:bg-accent/80 rounded-md dark:text-popover-foreground dark:hover:text-accent-foreground hover:bg-accent/10'
                  }
                  href={item.href}
                >
                  {item.title}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}

            {/* Admin-only navigation items */}
            <AdminOnly fallback={null}>
              {adminItems?.map((item, i) => (
                <NavigationMenuItem key={`admin-${i}`}>
                  <NavigationMenuLink
                    className={
                      'px-2 py-2 transition-colors dark:hover:bg-accent/80 rounded-md dark:text-popover-foreground dark:hover:text-accent-foreground hover:bg-accent/10'
                    }
                    href={item.href}
                  >
                    {item.title}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </AdminOnly>
          </NavigationMenuList>
        </NavigationMenu>
      ) : null}
    </>
  );
}

function MobileNavigation({ items }: { items?: MainNavItem[] }) {
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

  // Filter admin items for mobile nav too
  const publicItems = items?.filter(item => item.href !== '/admin') || [];
  const adminItems = items?.filter(item => item.href === '/admin') || [];

  // For now, include admin items if user is admin (mobile nav will handle display)
  const allItems = isAdminRole(user.role)
    ? [...publicItems, ...adminItems]
    : publicItems;

  return (
    <MobileNav
      userInfo={{
        name: user.name || undefined,
        email: user.email,
        image: user.image || undefined,
        username: user.username || undefined,
      }}
      items={allItems}
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
