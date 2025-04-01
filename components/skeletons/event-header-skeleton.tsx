import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "../icons";

export function EventHeaderSkeleton() {
  return (
    <header className="flex flex-col my-5 max-w-2xl mx-auto gap-3">
      <Skeleton className="h-12 w-96" />
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Icons.location className="size-6" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Icons.date className="size-6" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-4 w-96" />
      <Skeleton className="h-4 w-96" />
      <Skeleton className="h-4 w-64" />
    </header>
  );
}
