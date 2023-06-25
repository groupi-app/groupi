import { navConfig } from "@/config/nav";
import { MainNav } from "@/components/main-nav";
import { getPerson } from "@/lib/person";
import { currentUser } from "@clerk/nextjs";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default async function MainLayout({ children }: MainLayoutProps) {
  const user = await currentUser();
  const person = user !== null ? await getPerson(user.id) : null;
  const personInfo = {
    displayName: person?.displayName,
    username: user?.username,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="z-40 bg-primary text-primary-foreground dark:bg-background dark:text-foreground w-full">
        <MainNav personInfo={personInfo} items={navConfig.mainNav} />
      </header>
      <main>{children}</main>
    </div>
  );
}
