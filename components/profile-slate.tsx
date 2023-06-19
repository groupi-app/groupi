import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProfileSlateProps {}

export function ProfileSlate({}: ProfileSlateProps) {
  return (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarFallback className="text-foreground">JP</AvatarFallback>
        <AvatarImage src=" " />
      </Avatar>
      <div className="flex flex-col items-start">
        <span className="font-bold text-base leading-5">Jenna</span>
        <span className="font-normal">addylinear</span>
      </div>
    </div>
  );
}
