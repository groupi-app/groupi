"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { Icons } from "./icons";

export default function MemberIcon() {
  const fullName = "John Doe";
  const userInfo = {
    username: "johndoe",
    avatar: "https://i.pravatar.cc/150?img=68",
  };
  return (
    <Tooltip>
      <DropdownMenu>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger className="rounded-full border-2 border-background z-10">
            <Avatar>
              <AvatarImage src={userInfo.avatar} />
              <AvatarFallback>{"JD"}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>
            <div className="flex flex-col">
              {
                <span className="text-base text-card-foreground">
                  {fullName}
                </span>
              }
              <span className="text-muted-foreground">{userInfo.username}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer">
            <div className="flex items-center gap-1">
              <Icons.shield className="w-4 h-4" />
              <span>Promote</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer focus:bg-destructive focus:text-destructive-foreground">
            <div className="flex items-center gap-1">
              <Icons.kick className="w-4 h-4" />
              <span>Kick</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
        <TooltipContent>
          <span>{fullName != null ? fullName : userInfo.username}</span>
        </TooltipContent>
      </DropdownMenu>
    </Tooltip>
  );
}
