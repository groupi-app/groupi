import { NotificationWithPersonEventPost } from "@/types";
import { Button } from "./ui/button";
import { Icons } from "./icons";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import { Dialog, DialogTrigger } from "./ui/dialog";

export function NotificationSlate({
  notification,
}: {
  notification: NotificationWithPersonEventPost;
}) {
  const { person, event, post, createdAt, type, read, datetime } = notification;

  const getNotificationLink = () => {
    switch (type) {
      case "DATE_CHANGED":
      case "DATE_CHOSEN":
      case "DATE_RESET":
      case "USER_JOINED":
      case "USER_LEFT":
      case "USER_PROMOTED":
      case "USER_DEMOTED":
        return `/event/${event?.id}`;
      case "NEW_POST":
      case "NEW_REPLY":
        return `/post/${post?.id}`;
    }
  };

  const getNotificationMessage = () => {
    switch (type) {
      case "DATE_CHANGED":
        return {
          __html: `The date of <strong>${
            event?.title
          }</strong> has changed to <strong>${datetime?.getDay()} ${datetime?.toLocaleDateString()} at ${datetime?.toLocaleTimeString()}</strong>.`,
        };
      case "DATE_CHOSEN":
        return {
          __html: `<strong>${
            event?.title
          }</strong> will be held on <strong>${datetime?.getDay()} ${datetime?.toLocaleDateString()} at ${datetime?.toLocaleTimeString()}</strong>.`,
        };
      case "DATE_RESET":
        return {
          __html: `A new poll has started for the date of <strong>${event?.title}</strong>.`,
        };
      case "NEW_POST":
        return {
          __html: `<strong>${
            person.firstName ?? person.lastName ?? person.username
          }</strong> created a new post, <strong>${
            post?.title
          }</strong>, in <strong>${event?.title}</strong>.`,
        };
      case "NEW_REPLY":
        return {
          __html: `<strong>${
            person.firstName ?? person.lastName ?? person.username
          }</strong> replied to a post, <strong>${
            post?.title
          }</strong>, in <strong>${event?.title}</strong>.`,
        };
      case "USER_JOINED":
        return {
          __html: `<strong>${
            person.firstName ?? person.lastName ?? person.username
          }</strong> has joined <strong>${event?.title}</strong>.`,
        };
      case "USER_LEFT":
        return {
          __html: `<strong>${
            person.firstName ?? person.lastName ?? person.username
          }</strong> has left <strong>${event?.title}</strong>.`,
        };
      case "USER_PROMOTED":
        return {
          __html: `You are now a Moderator of <strong>${event?.title}</strong>.`,
        };
      case "USER_DEMOTED":
        return {
          __html: `You are no longer a Moderator of <strong>${event?.title}</strong>.`,
        };
    }
  };

  return (
    <div className="relative">
      <Link
        href={getNotificationLink()}
        className="hover:bg-accent flex items-center text-card-foreground gap-3 p-2 pr-8 transition-all"
      >
        {!read && <div className="w-2 h-2 rounded-full bg-primary p-1" />}
        <div className="flex flex-col gap-1">
          <p
            dangerouslySetInnerHTML={getNotificationMessage()}
            className="text-sm"
          ></p>
          <span className="text-xs text-muted-foreground">
            {formatDate(createdAt)}
          </span>
        </div>
      </Link>
      <Dialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="w-8 h-8 absolute right-2 top-0 bottom-0 my-auto"
              size="icon"
              variant="ghost"
            >
              <Icons.more />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="">
            {read ? (
              <DropdownMenuItem className="cursor-pointer" asChild>
                <div className="flex items-center gap-1">
                  <Icons.unread className="w-4 h-4" />
                  <span>Mark as unread</span>
                </div>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="cursor-pointer" asChild>
                <div className="flex items-center gap-1">
                  <Icons.read className="w-4 h-4" />
                  <span>Mark as read</span>
                </div>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              asChild
              className="focus:bg-destructive focus:text-destructive-foreground cursor-pointer"
            >
              <DialogTrigger asChild>
                <div className="flex items-center gap-1">
                  <Icons.delete className="w-4 h-4" />
                  <span>Delete</span>
                </div>
              </DialogTrigger>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Dialog>
    </div>
  );
}
