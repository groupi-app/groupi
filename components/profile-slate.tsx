import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserInfo } from "@/types";

interface ProfileSlateProps {
  userInfo: UserInfo;
}

export function ProfileSlate({ userInfo }: ProfileSlateProps) {
  return (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarFallback className="text-foreground">G</AvatarFallback>
        <AvatarImage src={userInfo.avatar} />
      </Avatar>
      <div className="flex flex-col items-start">
        <span className="text-base leading-5">
          {userInfo.firstName != null
            ? userInfo.lastName != null
              ? `${userInfo.firstName} ${userInfo.lastName}`
              : userInfo.firstName
            : userInfo.lastName != null
            ? userInfo.lastName
            : ""}
        </span>
        <span className="text-muted-foreground">{userInfo.username}</span>
      </div>
    </div>
  );
}
