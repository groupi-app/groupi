"use client";

import { Button } from "@/components/ui/button";
import { Icons } from "./icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NewPostButton() {
  const pathname = usePathname();
  return (
    <div className="fixed bottom-10 right-4 lg:bottom-24 lg:right-24 xl:right-48 2xl:right-1/4 z-30">
      <Link href={`${pathname}/newPost`}>
        <Button className="rounded-full flex items-center gap-1">
          <Icons.plus />
          <span>New Post</span>
        </Button>
      </Link>
    </div>
  );
}
