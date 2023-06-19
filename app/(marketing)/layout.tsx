import { navConfig } from "@/config/nav";
import { MainNav } from "@/components/main-nav";
import { ProfileButton } from "@/components/profile-button";

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default async function MarketingLayout({
  children,
}: MarketingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="z-40 bg-primary text-primary-foreground dark:bg-background dark:text-foreground w-full">
        <MainNav items={navConfig.mainNav} />
      </header>
      <main>{children}</main>
    </div>
  );
}
