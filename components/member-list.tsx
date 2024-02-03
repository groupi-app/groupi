"use client";
import { useRef, useState, useEffect } from "react";
import MemberIcon from "@/components/member-icon";
import Link from "next/link";
import { Button } from "./ui/button";
import { UserInfo } from "@/types";
import { usePathname } from "next/navigation";
import { useEventMembers } from "@/data/event-hooks";

export default function MemberList({ eventId }: { eventId: string }) {
  const { data: memberData } = useEventMembers(eventId);

  const { members }: { members: UserInfo[] } = memberData;

  const ref = useRef<HTMLDivElement>(null);
  const [visibleIcons, setVisibleIcons] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    function checkOverflow() {
      if (ref.current) {
        const { scrollWidth, clientWidth } = ref.current;
        const iconWidth = 40; // Replace with your icon width
        const iconsCount = Math.floor(clientWidth / iconWidth);
        setVisibleIcons(iconsCount);
      }
    }

    checkOverflow();

    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, []);

  return (
    <div>
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-heading">Attendees</h2>
        <div className="rounded-full p-[.3rem] flex items-center justify-center text-xs bg-muted text-muted-foreground text-center">
          <span>{members.length}</span>
        </div>
      </div>
      <div
        ref={ref}
        className="flex items-center p-2 -space-x-2 h-[54px] overflow-hidden"
      >
        {members.map((user, i) =>
          i < visibleIcons - 1 ? (
            <MemberIcon key={i} userInfo={user} />
          ) : (
            i === visibleIcons - 1 && (
              <Link href={`${pathname}/members`}>
                <Button className="rounded-full z-30" key={i}>
                  +{members.length - visibleIcons + 1}
                </Button>
              </Link>
            )
          )
        )}
      </div>
      <Link href={`${pathname}/members`}>
        <span className="rounded-full z-30 text-primary hover:underline">
          View All
        </span>
      </Link>
    </div>
  );
}
