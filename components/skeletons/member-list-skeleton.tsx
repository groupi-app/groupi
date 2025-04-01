import { Skeleton } from "../ui/skeleton";

export function MemberListSkeleton() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-heading font-medium">Attendees</h2>
        <Skeleton className="rounded-full size-5 flex items-center justify-center text-xs" />
      </div>
      <div className="flex items-center p-2 -space-x-2">
        <Skeleton className="rounded-full size-10 border-2 border-background" />
        <Skeleton className="rounded-full size-10 border-2 border-background" />
        <Skeleton className="rounded-full size-10 border-2 border-background" />
        <Skeleton className="rounded-full size-10 border-2 border-background" />
      </div>
    </div>
  );
}
