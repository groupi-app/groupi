import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "./icons";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "./ui/dropdown-menu";

export function PostCard() {
  return (
    <DropdownMenu>
      <div className="flex items-center justify-between rounded-md border border-border w-full relative">
        <Link href={"/"} className="w-full z-10">
          <div className="w-full hover:bg-accent transition-all p-4">
            <div className="grid gap-1">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
              </div>
            </div>
          </div>
        </Link>
        <DropdownMenuTrigger className="absolute z-20 w-8 h-8 hover:bg-accent transition-all rounded-md top-1 right-1 flex items-center justify-center">
          <Icons.more />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
          <DropdownMenuItem>Team</DropdownMenuItem>
          <DropdownMenuItem>Subscription</DropdownMenuItem>
        </DropdownMenuContent>
      </div>
    </DropdownMenu>
  );
}

PostCard.Skeleton = function PostCardSkeleton() {
  return (
    <div className="p-4">
      <div className="space-y-3">
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
};
