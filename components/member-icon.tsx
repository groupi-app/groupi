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
import { Member, UserInfo } from "@/types";
import { formatRoleBadge, formatRoleName, getFullName } from "@/lib/utils";

export default function MemberIcon({ member }: { member: Member }) {
  const { firstName, lastName, username, imageUrl } = member.person;
  const role = member.role;

  const initials = firstName?.toString()[0] + "" + lastName?.toString()[0];

  const fullName = getFullName(firstName, lastName);

  return (
    <Tooltip>
      <DropdownMenu>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger className="rounded-full">
            <Avatar>
              <AvatarImage src={imageUrl} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-base text-card-foreground">{fullName}</span>
              <span className="text-muted-foreground">{username}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>
            <div className="flex items-center gap-1">
              <div className="text-card-foreground">
                {formatRoleBadge(role)}
              </div>
              <span className="text-card-foreground">
                {formatRoleName(role)}
              </span>
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
          <span>{fullName != null ? fullName : username}</span>
        </TooltipContent>
      </DropdownMenu>
    </Tooltip>
  );
}
