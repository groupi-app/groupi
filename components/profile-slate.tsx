import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserInfo } from "@/types";
import { Button } from "./ui/button";
import { useState } from "react";
import { Icons } from "./icons";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationWidget } from "./notification-widget";
import { getFullName, getInitials } from "@/lib/utils";
import { NotificationCount } from "./notification-count";

interface ProfileSlateProps {
  userInfo: UserInfo;
}

export function ProfileSlate({ userInfo }: ProfileSlateProps) {
  const [open, setOpen] = useState(false);

  const initials = getInitials(userInfo.firstName, userInfo.lastName);
  const fullName = getFullName(userInfo.firstName, userInfo.lastName);

  return (
    <div>
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={userInfo.imageUrl} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-start">
          {fullName != "" && (
            <span className="text-base text-card-foreground">{fullName}</span>
          )}
          <span className="text-muted-foreground">{userInfo.username}</span>
        </div>
        <div>
          <Button
            onClick={() => {
              setOpen(!open);
            }}
            size="icon"
            variant="ghost"
            className="rounded-full"
          >
            <NotificationCount userId={userInfo.id}>
              <Icons.bell className="w-5 h-5" />
            </NotificationCount>
          </Button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden p-2"
          >
            <NotificationWidget userId={userInfo.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
