import { Icons } from '@/components/icons';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { siteConfig } from '@/config/site';
import { Button } from '@/components/ui/button';
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
import { useQuery } from 'convex/react';
import { isAdminRole } from '@/lib/constants';

// Dynamic require to avoid deep type instantiation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let authQueries: any;
function initApi() {
  if (!authQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    authQueries = api.auth?.queries ?? {};
  }
}
initApi();

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
            <NotificationsDesktop />
            <AuthenticatedProfileDropdown />
          </div>
        </div>
      </Authenticated>

      <Unauthenticated>
        <div
          className={
            'hidden md:block px-2 py-2 transition-colors hover:bg-primary-foreground/10 dark:hover:bg-accent rounded-md font-semibold cursor-pointer'
          }
        >
          <Link href='/sign-in'>
            <Button variant='ghost' size='sm'>
              <div className='flex items-center gap-1'>
                <span className='whitespace-nowrap'>Sign In</span>
                <Icons.signIn className='size-5' />
              </div>
            </Button>
          </Link>
        </div>
      </Unauthenticated>

      <AuthLoading>
        <div className='hidden md:block'>
          <div className='animate-spin h-6 w-6 border-2 border-gray-300 border-t-gray-900 rounded-full'></div>
        </div>
      </AuthLoading>
    </div>
  );
}

function AuthenticatedNav({ items }: { items?: MainNavItem[] }) {
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
                    'px-2 py-2 transition-colors dark:hover:bg-accent rounded-md dark:text-popover-foreground dark:hover:text-accent-foreground hover:bg-accent/10'
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
                      'px-2 py-2 transition-colors dark:hover:bg-accent rounded-md dark:text-popover-foreground dark:hover:text-accent-foreground hover:bg-accent/10'
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
  const userAndPerson = useQuery(authQueries.getCurrentUserAndPerson, {});

  if (!userAndPerson) {
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

  const { user } = userAndPerson;

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
  const userAndPerson = useQuery(authQueries.getCurrentUserAndPerson, {});

  if (!userAndPerson) {
    return (
      <div className='animate-spin h-6 w-6 border-2 border-gray-300 border-t-gray-900 rounded-full'></div>
    );
  }

  const { user } = userAndPerson;

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
