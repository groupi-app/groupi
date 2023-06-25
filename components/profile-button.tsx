import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PersonInfo } from "@/types";
import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { SettingsModal } from "./settings-modal";
import { Dialog, DialogTrigger } from "./ui/dialog";

interface ProfileButtonProps {
  personInfo: PersonInfo;
}

export function ProfileButton({ personInfo }: ProfileButtonProps) {
  return (
    <Dialog>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar>
            <AvatarFallback className="text-foreground">
              {typeof personInfo.displayName === "string"
                ? personInfo.displayName.at(0)
                : ""}
            </AvatarFallback>
            <AvatarImage src=" " />
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="font-medium" align="end">
          <DropdownMenuLabel className="flex flex-col items-start">
            <span className="font-bold text-base leading-5">
              {personInfo.displayName}
            </span>
            <span className="font-normal">{personInfo.username}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DialogTrigger className="w-full">
            <DropdownMenuItem className="cursor-pointer">
              Settings
            </DropdownMenuItem>
          </DialogTrigger>

          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <SignOutButton>Sign Out</SignOutButton>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SettingsModal />
    </Dialog>
  );
}
