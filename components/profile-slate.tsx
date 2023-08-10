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
  const initials =
    userInfo.firstName?.toString()[0] + "" + userInfo.lastName?.toString()[0];

  let fullName = "";
  if (userInfo.firstName && userInfo.lastName) {
    fullName = userInfo.firstName + " " + userInfo.lastName;
  } else if (userInfo.firstName && !userInfo.lastName) {
    fullName = userInfo.firstName;
  } else if (!userInfo.firstName && userInfo.lastName) {
    fullName = userInfo.lastName;
  }
  return (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarImage src={userInfo.avatar} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start">
        {fullName != "" && (
          <span className="text-base text-card-foreground">{fullName}</span>
        )}
        <span className="text-muted-foreground">{userInfo.username}</span>
      </div>
    </div>
  );
}
