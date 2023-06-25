import { navConfig } from "@/config/nav";
import { MainNav } from "@/components/main-nav";
import { currentUser } from "@clerk/nextjs";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default async function MainLayout({ children }: MainLayoutProps) {
  const user = await currentUser();
  const userInfo = {
    firstName: user?.firstName,
    lastName:user?.lastName,
    username: user?.username,
    avatar: user?.profileImageUrl
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="z-40 w-full bg-primary text-primary-foreground dark:bg-background dark:text-foreground">
        <MainNav userInfo={userInfo} items={navConfig.mainNav} />
      </header>
      <main>{children}</main>
    </div>
  );
}
