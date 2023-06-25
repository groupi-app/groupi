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

interface ProfileSlateProps {
  personInfo: PersonInfo;
}

export function ProfileSlate({ personInfo }: ProfileSlateProps) {
  return (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarFallback className="text-foreground">
          {typeof personInfo.displayName === "string"
            ? personInfo.displayName.at(0)
            : ""}
        </AvatarFallback>
        <AvatarImage src=" " />
      </Avatar>
      <div className="flex flex-col items-start">
        <span className="font-bold text-base leading-5">
          {personInfo.displayName}
        </span>
        <span className="font-normal">{personInfo.username}</span>
      </div>
    </div>
  );
}
