import "@/styles/globals.css";
import { Inter as FontSans } from "next/font/google";
import localFont from "next/font/local";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

import { ClerkProvider, currentUser } from "@clerk/nextjs";
import { Analytics } from "@/components/analytics";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { navConfig } from "@/config/nav";
import { MainNav } from "@/components/main-nav";
import { TooltipProvider } from "@/components/ui/tooltip";
import Providers from "@/lib/providers";

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
      name: "Thomas Surette",
      url: "https://tsurette.com",
    },
  ],
  creator: "Thomas Surette",
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
    creator: "@tomsurette",
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
  const userInfo = {
    firstName: user?.firstName,
    lastName: user?.lastName,
    username: user?.username,
    avatar: user?.imageUrl,
  };

  return (
    <Providers>
      <html lang="en">
        <body
          className={cn(
            "min-h-screen bg-background font-sans antialiased",
            fontSans.variable,
            fontHeading.variable
          )}
        >
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <TooltipProvider>
              <div className="flex flex-col min-h-screen">
                <header className="z-40 w-full bg-primary text-primary-foreground dark:bg-background dark:text-foreground">
                  <MainNav userInfo={userInfo} items={navConfig.mainNav} />
                </header>
                <main>{children}</main>
              </div>
            </TooltipProvider>
          </ThemeProvider>
          <Analytics />
          <Toaster />
          <TailwindIndicator />
        </body>
      </html>
    </Providers>
  );
}
