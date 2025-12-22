import { getSession } from '@groupi/services/server';
import { getCachedAccountSettingsData } from '@groupi/services/server';
import { db } from '@groupi/services/server';
import { cacheLife, cacheTag } from 'next/cache';
import { MainNavDynamic } from './main-nav-dynamic';
import { MainNavItem } from '@/types';

interface MainNavDynamicWrapperProps {
  items?: MainNavItem[];
}

/**
 * Server component wrapper that fetches session and passes it to MainNavDynamic
 * Uses 'use cache: private' + cacheLife to enable headers() and prevent prerendering
 * Wrapped in Suspense boundary in layout.tsx
 *
 * Fetches username and profile fields (name, image, pronouns, bio) from database (cached)
 * to ensure they're up-to-date even if session JWT is stale
 */
export async function MainNavDynamicWrapper({
  items,
}: MainNavDynamicWrapperProps) {
  'use cache: private';
  cacheLife({ stale: 60 }); // 1 minute cache for nav session

  const [error, sessionData] = await getSession();
  const session = error ? null : sessionData;

  // Add cache tag for this component so it can be invalidated when user data changes
  if (session?.user?.id) {
    cacheTag(`user-${session.user.id}`, `user-${session.user.id}-account`);
  }

  // Fetch username and profile fields from database (cached) to ensure they're up-to-date
  // This bypasses the JWT token which may have stale data
  let username: string | null | undefined = undefined;
  let profileData: {
    name: string | null;
    image: string | null;
    imageKey: string | null;
    pronouns: string | null;
    bio: string | null;
  } | null = null;

  if (session?.user?.id) {
    // Fetch username from account settings
    const [accountError, accountData] = await getCachedAccountSettingsData();
    if (!accountError && accountData) {
      username = accountData.username;
    }

    // Fetch profile fields directly from database
    // This is cached via the cache tag system - when user-${userId} is invalidated,
    // this component will re-render and fetch fresh data
    try {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: {
          name: true,
          image: true,
          imageKey: true,
          pronouns: true,
          bio: true,
        },
      });
      if (user) {
        profileData = {
          name: user.name,
          image: user.image,
          imageKey: user.imageKey,
          pronouns: user.pronouns,
          bio: user.bio,
        };
      }
    } catch {
      // If database query fails, fall back to session data
      // Don't throw - we can still render with session data
    }
  }

  // Merge database data into session data if available
  // Only override fields that are not null to maintain type compatibility
  const sessionWithFreshData = session
    ? {
        ...session,
        user: {
          ...session.user,
          // Override username from database if available
          ...(username !== undefined && { username }),
          // Override profile fields from database if available and not null
          ...(profileData && {
            ...(profileData.name !== null && { name: profileData.name }),
            ...(profileData.image !== null && { image: profileData.image }),
            ...(profileData.imageKey !== null && {
              imageKey: profileData.imageKey,
            }),
            ...(profileData.pronouns !== null && {
              pronouns: profileData.pronouns,
            }),
            ...(profileData.bio !== null && { bio: profileData.bio }),
          }),
        },
      }
    : null;

  return <MainNavDynamic items={items} session={sessionWithFreshData} />;
}
