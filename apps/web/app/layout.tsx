import React from 'react';
import '@/styles/globals.css';
import { Inter as FontSans } from 'next/font/google';
import localFont from 'next/font/local';

import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

import { MainNavStatic } from '@/components/main-nav-static';
import { MainNavDynamic } from '@/components/main-nav-dynamic';
import { ModeToggle } from '@/components/mode-toggle';
import { GlobalUI } from '@/components/global-ui';
import { FooterCopyright } from '@/components/footer-copyright';
import { navConfig } from '@/config/nav';
import { getCurrentSession } from '@groupi/services';
import Link from 'next/link';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PusherBeamsProviderWrapper } from '@/components/providers/pusher-beams-provider-wrapper';

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
        <Suspense
          fallback={
            <LayoutShellWithoutSession>{children}</LayoutShellWithoutSession>
          }
        >
          <DynamicRootContent>{children}</DynamicRootContent>
        </Suspense>
        <GlobalUI />
      </body>
    </html>
  );
}

async function DynamicRootContent({ children }: { children: React.ReactNode }) {
  'use cache: private';

  const [error, sessionData] = await getCurrentSession();
  const session = error ? null : sessionData;

  return (
    <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
      <TooltipProvider>
        <PusherBeamsProviderWrapper>
          <div className='flex flex-col min-h-screen'>
            <header className='z-40 w-full bg-primary text-primary-foreground dark:bg-background dark:text-foreground'>
              <MainNavStatic
                dynamicContent={
                  <MainNavDynamic items={navConfig.mainNav} session={session} />
                }
              />
            </header>
            <main className='grow'>{children}</main>
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
        </PusherBeamsProviderWrapper>
      </TooltipProvider>
    </ThemeProvider>
  );
}

function LayoutShellWithoutSession({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
      <TooltipProvider>
        <PusherBeamsProviderWrapper>
          <div className='flex flex-col min-h-screen'>
            <header className='z-40 w-full bg-primary text-primary-foreground dark:bg-background dark:text-foreground'>
              <MainNavStatic dynamicContent={<MainNavDynamicSkeleton />} />
            </header>
            <main className='grow'>{children}</main>
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
        </PusherBeamsProviderWrapper>
      </TooltipProvider>
    </ThemeProvider>
  );
}

// Skeleton for dynamic nav content
function MainNavDynamicSkeleton() {
  return (
    <div className='flex items-center justify-end w-full gap-2'>
      <Skeleton className='h-8 w-24' />
      <Skeleton className='h-8 w-8 rounded-full' />
    </div>
  );
}
