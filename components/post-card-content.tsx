"use client";
import { useIsOverflowing } from "@/lib/use-is-overflow";

export function PostCardContent({ content }: { content: string }) {
  const [ref, isOverflowing] = useIsOverflowing();

  return (
    <>
      <div
        className="max-h-[120px] overflow-hidden"
        ref={ref}
        dangerouslySetInnerHTML={{
          __html: content,
        }}
      />
      {isOverflowing && (
        <div className="text-muted-foreground">Open to see full post...</div>
      )}
    </>
  );
}
