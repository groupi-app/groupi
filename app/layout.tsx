import "@/styles/globals.css";
import { Inter as FontSans } from "next/font/google";
import localFont from "next/font/local";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

import { Analytics } from "@/components/analytics";
import { MainNav } from "@/components/main-nav";
import { ModeToggle } from "@/components/mode-toggle";
import ClerkProvider from "@/components/providers/my-clerk-provider";
import QueryProvider from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { navConfig } from "@/config/nav";
import { fetchNotificationsForPerson } from "@/lib/actions/notification";
import { getNotificationQuery } from "@/lib/query-definitions";
import { UserInfo } from "@/types";
import { currentUser } from "@clerk/nextjs";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import Link from "next/link";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontHeading = localFont({
  src: "../assets/fonts/Geologica.ttf",
  variable: "--font-heading",
});

export const metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "Next.js",
    "React",
    "Tailwind CSS",
    "Server Components",
    "Radix UI",
  ],
  authors: [
    {
      name: "Theia Surette",
      url: "https://tsurette.com",
    },
  ],
  creator: "Theia Surette",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [`${siteConfig.url}/og.jpg`],
    creator: "@theiasurette",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: `${siteConfig.url}/site.webmanifest`,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  const queryClient = new QueryClient();
  let queryDefinition = null;
  if (user) {
    const data = await fetchNotificationsForPerson(user.id);
    queryDefinition = getNotificationQuery(user.id);

    await queryClient.prefetchQuery({
      queryKey: [queryDefinition.queryKey],
      queryFn: async () => data,
      staleTime: 0,
    });
  }

  let userInfo: UserInfo = {
    firstName: "",
    lastName: "",
    username: "",
    imageUrl: "",
    id: "",
  };

  if (user) {
    userInfo = {
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      imageUrl: user.imageUrl,
      id: user.id,
    };
  }

  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
          fontHeading.variable
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ClerkProvider>
            <TooltipProvider>
              {user !== null && queryDefinition !== null ? (
                <QueryProvider queryDefinition={queryDefinition}>
                  <HydrationBoundary state={dehydrate(queryClient)}>
                    <InnerLayout userInfo={userInfo}>{children}</InnerLayout>
                  </HydrationBoundary>
                </QueryProvider>
              ) : (
                <InnerLayout userInfo={userInfo}>{children}</InnerLayout>
              )}
            </TooltipProvider>
          </ClerkProvider>
        </ThemeProvider>
        <Analytics />
        <Toaster />
        <TailwindIndicator />
      </body>
    </html>
  );
}

function InnerLayout({
  userInfo,
  children,
}: {
  userInfo: UserInfo;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="z-40 w-full bg-primary text-primary-foreground dark:bg-background dark:text-foreground">
        <MainNav userInfo={userInfo} items={navConfig.mainNav} />
      </header>
      <main className="flex-grow">{children}</main>
      <footer className="bg-primary text-primary-foreground dark:border-t dark:border-border dark:bg-background dark:text-foreground">
        <div className="container mx-auto py-4 flex gap-8 items-center">
          <ModeToggle />
          <div className="flex flex-col gap-2">
            <p>
              Built by{" "}
              <Link
                className="underline font-medium"
                href="https://tsurette.com"
              >
                Theia
              </Link>
            </p>
            <p className="text-sm">
              &copy; {new Date().getFullYear()} {siteConfig.name}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
