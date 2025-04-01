import { HomeHeader } from "@/components/home-header";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="container max-w-3xl py-8 flex flex-col gap-8">
      <div className="">
        <HomeHeader />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground">
          Welcome to Groupi! The app designed to take the frustration out of
          making plans.
        </p>
        <p>
          Groupi is currently under active development and will continue to grow
          and change over time. If you have any feedback, please contact{" "}
          {
            <Link className="underline font-medium" href="https://tsurette.com">
              Theia
            </Link>
          }{" "}
          and let her know!
        </p>
        <p>Otherwise, I hope you enjoy!</p>
      </div>
      <Link href="/create">
        <Button className="flex items-center gap-1">
          <Icons.arrowRight className="size-4" />
          <span>Get Started!</span>
        </Button>
      </Link>
    </div>
  );
}
