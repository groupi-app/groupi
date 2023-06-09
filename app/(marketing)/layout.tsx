import { marketingConfig } from "@/config/marketing";
import { MainNav } from "@/components/main-nav";

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default async function MarketingLayout({
  children,
}: MarketingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="z-40 bg-primary text-primary-foreground dark:bg-background dark:text-foreground w-full">
        <div className="flex h-20 items-center justify-between py-6 container">
          <MainNav items={marketingConfig.mainNav} />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
