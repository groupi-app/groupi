import { Icons } from "./icons";
import { NotificationCount } from "./notification-count";
import { NotificationWidget } from "./notification-widget";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export function NotificationsDesktop({ userId }: { userId: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="rounded-full">
          <NotificationCount userId={userId}>
            <Icons.bell className="w-5 h-5" />
          </NotificationCount>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <NotificationWidget userId={userId} />
      </PopoverContent>
    </Popover>
  );
}
