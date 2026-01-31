import React from 'react';
import '@/styles/globals.css';
import { Inter as FontSans } from 'next/font/google';
import localFont from 'next/font/local';

import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

import { MainNavStatic } from '@/components/main-nav-static';
import { NavigationWrapper } from '@/components/navigation-wrapper';
import { ModeToggle } from '@/components/mode-toggle';
import { AppProviders } from '@/components/app-providers';
import { FooterCopyright } from '@/components/footer-copyright';
import { navConfig } from '@/config/nav';
import Link from 'next/link';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeProvider } from '@/providers/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ConvexClientProvider } from '@/providers/convex-provider';
import { VisibilityProvider } from '@/providers/visibility-provider';
import { GlobalUserProvider } from '@/context/global-user-context';
import { NavigationGuardProvider } from '@/app/(settings)/settings/components/navigation-guard-context';
import { GlobalNavigationGuard } from '@/components/global-navigation-guard';
import { OnboardingRedirectWrapper } from '@/components/onboarding-redirect-wrapper';
import { GoogleOneTap } from '@/components/google-one-tap';
import { GlobalPresenceTracker } from '@/components/global-presence-tracker';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontHeading = localFont({
  src: '../../../assets/fonts/Geologica.ttf',
  variable: '--font-heading',
});

export const metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    'Next.js',
    'React',
    'Tailwind CSS',
    'Server Components',
    'Radix UI',
    'Progressive Web App',
    'PWA',
    'Event Planning',
    'Group Events',
  ],
  authors: [
    {
      name: 'Theia Surette',
      url: 'https://tsurette.com',
    },
  ],
  creator: 'Theia Surette',
  metadataBase: new URL(siteConfig.url),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Groupi',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [`${siteConfig.url}/og.jpg`],
    creator: '@theiasurette',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang='en'>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable,
          fontHeading.variable
        )}
      >
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          <ConvexClientProvider>
            <VisibilityProvider>
              <GlobalUserProvider>
                <TooltipProvider>
                  <NavigationGuardProvider>
                    <Suspense fallback={null}>
                      <GlobalNavigationGuard />
                    </Suspense>
                    <Suspense fallback={null}>
                      <OnboardingRedirectWrapper />
                    </Suspense>
                    <Suspense fallback={null}>
                      <GoogleOneTap />
                    </Suspense>
                    <Suspense fallback={null}>
                      <GlobalPresenceTracker />
                    </Suspense>
                    <div className='flex flex-col min-h-screen'>
                      {/* Static header shell - renders immediately */}
                      <header className='z-sticky w-full bg-primary text-primary-foreground dark:bg-background dark:text-foreground'>
                        <MainNavStatic
                          dynamicContent={
                            <Suspense fallback={<MainNavDynamicSkeleton />}>
                              <NavigationWrapper items={navConfig.mainNav} />
                            </Suspense>
                          }
                        />
                      </header>
                      {/* Static main content area */}
                      <main className='grow'>{children}</main>
                      {/* Static footer */}
                      <footer className='bg-primary text-primary-foreground dark:border-t dark:border-border dark:bg-background dark:text-foreground h-24'>
                        <div className='container mx-auto py-4 flex gap-8 items-center'>
                          <ModeToggle />
                          <div className='flex flex-col gap-2'>
                            <p>
                              Built by{' '}
                              <Link
                                className='underline font-medium'
                                href='https://tsurette.com'
                              >
                                Theia
                              </Link>
                            </p>
                            <FooterCopyright />
                          </div>
                        </div>
                      </footer>
                    </div>
                  </NavigationGuardProvider>
                </TooltipProvider>
              </GlobalUserProvider>
            </VisibilityProvider>
          </ConvexClientProvider>
          <AppProviders />
        </ThemeProvider>
      </body>
    </html>
  );
}

// Skeleton for dynamic nav content - matches MainNavDynamic structure
function MainNavDynamicSkeleton() {
  return (
    <div className='flex items-center justify-end w-full gap-2'>
      {/* Navigation menu items skeleton (hidden on mobile) */}
      <div className='hidden gap-4 md:flex'>
        <Skeleton className='h-8 w-20' />
        <Skeleton className='h-8 w-24' />
      </div>

      {/* Right side: notifications and profile (hidden on mobile) */}
      <div className='hidden md:flex ml-auto items-center gap-3'>
        <Skeleton className='h-8 w-8 rounded-full' />
        <Skeleton className='h-8 w-8 rounded-full' />
      </div>

      {/* Mobile nav button skeleton (visible on mobile) */}
      <Skeleton className='h-8 w-8 rounded-md md:hidden' />
    </div>
  );
}
