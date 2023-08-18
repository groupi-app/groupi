import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "./icons";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Post } from "@/types";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { id, title, body, author, createdAt, replies } = post;
  const initials =
    author.firstName?.toString()[0] + "" + author.lastName?.toString()[0];

  let fullName = "";
  if (author.firstName && author.lastName) {
    fullName = author.firstName + " " + author.lastName;
  } else if (author.firstName && !author.lastName) {
    fullName = author.firstName;
  } else if (!author.firstName && author.lastName) {
    fullName = author.lastName;
  }
  return (
    <DropdownMenu>
      <div className="rounded-xl border border-border w-full relative shadow-md z-10">
        <Link href={`/post/${id}`} className="w-full z-10">
          <div className="w-full rounded-xl hover:bg-accent transition-all pt-4 px-5 pb-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 w-full">
                <div>
                  <Avatar>
                    <AvatarImage src={author.avatar} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex flex-col -space-y-1 w-full pr-16">
                  <span className="sm:text-lg text-card-foreground truncate overflow-hidden w-full">
                    {title}
                  </span>
                  {fullName != "" ? (
                    <span className="text-sm text-muted-foreground">
                      {fullName}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {author.username}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-card-foreground line-clamp">
                  {body}
                </p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-muted-foreground text-sm">
                  {createdAt}
                </span>
                <span className="text-muted-foreground text-sm">{replies}</span>
              </div>
            </div>
          </div>
        </Link>
        <DropdownMenuTrigger className="absolute z-20 w-8 h-8 hover:bg-accent transition-all rounded-md top-1 right-1 flex items-center justify-center">
          <Icons.more />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <div className="flex items-center gap-1">
              <Icons.edit className="w-4 h-4" />
              <span>Edit</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className="focus:bg-destructive focus:text-destructive-foreground">
            <div className="flex items-center gap-1">
              <Icons.delete className="w-4 h-4" />
              <span>Delete</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </div>
    </DropdownMenu>
  );
}

PostCard.Skeleton = function PostCardSkeleton() {
  return (
    <div className="rounded-md border border-border w-full relative shadow-md max-w-2xl">
      <div className="w-full transition-all pt-4 px-5 pb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex flex-col space-y-1">
              <Skeleton className="w-36 h-4" />
              <Skeleton className="w-16 h-3" />
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-3/4 h-4" />
          </div>
          <div className="flex items-center justify-between mt-2">
            <Skeleton className="w-16 h-4" />
            <Skeleton className="w-16 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
