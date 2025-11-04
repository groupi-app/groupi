import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { MainNavItem } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MobileNav } from './mobile-nav';
import { NotificationsDesktop } from './notifications-desktop';
import { ProfileDropdown } from './profile-dropdown';
import { Session } from '@groupi/services';
import { Icons } from '@/components/icons';
import { NotificationCloseContextProvider } from '@/components/providers/notif-close-provider';

interface MainNavDynamicProps {
  items?: MainNavItem[];
  session: Session | null;
}

/**
 * Dynamic navigation content - requires session data
 * Wrapped in Suspense in the layout
 */
export function MainNavDynamic({ items, session }: MainNavDynamicProps) {
  // Filter out admin link for non-admin users
  // Use type assertion since Better Auth types don't include additionalFields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isAdmin = (session?.user as any)?.role?.includes('admin');
  const filteredItems = items?.filter(
    item => item.href !== '/admin' || isAdmin
  );

  return (
    <NotificationCloseContextProvider>
      {session?.user?.id && filteredItems?.length ? (
        <NavigationMenu>
          <NavigationMenuList
            className={'hidden gap-4 font-semibold text-sm md:flex'}
          >
            {filteredItems?.map((item, i) => (
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
          </NavigationMenuList>
        </NavigationMenu>
      ) : null}
      <MobileNav
        userInfo={{
          id: session?.user?.id || '',
          name: session?.user?.name || null,
          email: session?.user?.email || '',
          image: session?.user?.image || null,
        }}
        items={filteredItems || []}
      />
      <div className='ml-auto'>
        {session?.user && (
          <div className='hidden md:block'>
            <div className='flex items-center gap-3'>
              <NotificationsDesktop />
              <ProfileDropdown
                userInfo={{
                  id: session.user.id,
                  name: session.user.name || null,
                  email: session.user.email,
                  image: session.user.image || null,
                  imageKey: session.user.imageKey || null,
                  pronouns: session.user.pronouns || null,
                  bio: session.user.bio || null,
                }}
              />
            </div>
          </div>
        )}
        {!session?.user && (
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
        )}
      </div>
    </NotificationCloseContextProvider>
  );
}
