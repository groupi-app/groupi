import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";

interface ProfileButtonProps {}

export function ProfileButton({}: ProfileButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarFallback className="text-foreground">JP</AvatarFallback>
          <AvatarImage src=" " />
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="font-medium" align="end">
        <DropdownMenuLabel className="flex flex-col items-start">
          <span className="font-bold text-base leading-5">Jenna</span>
          <span className="font-normal">addylinear</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href="my-profile">
          <DropdownMenuItem className="cursor-pointer">
            My Profile
          </DropdownMenuItem>
        </Link>
        <Link href="settings">
          <DropdownMenuItem className="cursor-pointer">
            Settings
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <SignOutButton>Sign Out</SignOutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
