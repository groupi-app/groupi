import { Icons } from '@/components/icons';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { siteConfig } from '@/config/site';
import Link from 'next/link';
import { MobileNav } from './mobile-nav';
import { NotificationsDesktop } from './notifications-desktop';
import { ProfileDropdown } from './profile-dropdown';
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
  AdminOnly,
} from '@/components/auth/auth-wrappers';
import { useGlobalUser } from '@/context/global-user-context';
import { isAdminRole } from '@/lib/constants';

type NavItem = {
  href: string;
  title: string;
  disabled?: boolean;
};

// Alias for backwards compatibility
type MainNavItem = NavItem;

export function MainNav({ items }: { items: NavItem[] }) {
  return (
    <div className='container flex items-center justify-between h-20 py-6'>
      <div className='flex md:gap-10 w-full'>
        <Link
          href='/'
          aria-label={`${siteConfig.name} home`}
          className='items-center hidden space-x-2 md:flex'
        >
          <Icons.logo width='26' height='23' viewBox='0 0 197 225' />
          <span className='hidden text-xl font-bold font-heading sm:inline-block'>
            {siteConfig.name}
          </span>
        </Link>

        <Authenticated>
          <AuthenticatedNav items={items} />
        </Authenticated>

        <Authenticated>
          <AuthenticatedMobileNav items={items} />
        </Authenticated>
      </div>

      <Authenticated>
        <div className='hidden md:block'>
          <div className='flex items-center gap-3'>
            <Link
              href='/create'
              className='flex items-center gap-1.5 h-9 px-3 text-sm font-semibold rounded-button bg-primary text-primary-foreground hover:bg-primary/90 transition-colors'
            >
              <Icons.plus className='size-4' />
              <span>Create</span>
            </Link>
            <NotificationsDesktop />
            <AuthenticatedProfileDropdown />
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
  );
}

function AuthenticatedNav({ items }: { items?: MainNavItem[] }) {
  // Filter navigation items - remove My Events, New Event, and admin items
  const publicItems = items?.filter(
    item =>
      item.href !== '/admin' &&
      item.title !== 'My Events' &&
      item.title !== 'New Event'
  );
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

function AuthenticatedMobileNav({ items }: { items?: MainNavItem[] }) {
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

function AuthenticatedProfileDropdown() {
  // Use global user context instead of direct query
  const { user, isLoading } = useGlobalUser();

  if (isLoading || !user) {
    return (
      <div className='animate-spin h-6 w-6 border-2 border-border border-t-foreground rounded-full'></div>
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
