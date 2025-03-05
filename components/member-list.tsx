"use client";
import MemberIcon from "@/components/member-icon";
import { useEventMembers } from "@/data/event-hooks";
import { Member } from "@/types";
import { $Enums } from "@prisma/client";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { Icons } from "./icons";
import { Button } from "./ui/button";

export function MemberList({ eventId }: { eventId: string }) {
  const { data: memberData } = useEventMembers(eventId);

  const {
    members,
    userRole,
    userId,
  }: { members: Member[]; userRole: $Enums.Role; userId: string } = memberData;

  const ref = useRef<HTMLDivElement>(null);

  const [visibleIcons, setVisibleIcons] = useState(100);
  const pathname = usePathname();

  useLayoutEffect(() => {
    function checkOverflow() {
      if (ref.current) {
        const { clientWidth } = ref.current;
        const iconWidth = 40; // Replace with your icon width
        const iconsCount = Math.floor(clientWidth / iconWidth);
        setVisibleIcons(iconsCount);
      }
    }

    checkOverflow();

    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, x: 15 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-heading font-medium">Attendees</h2>
        <div className="rounded-full p-[.3rem] flex items-center justify-center text-xs bg-muted text-muted-foreground text-center">
          <span>{members.length}</span>
        </div>
        {(userRole === "ORGANIZER" || userRole === "MODERATOR") && (
          <Link href={`/event/${eventId}/invite`}>
            <Button className="flex items-center gap-1" size="sm">
              <Icons.invite className="w-4 h-4" />
              <span>Invite</span>
            </Button>
          </Link>
        )}
      </div>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        ref={ref}
        className="flex items-center p-2 -space-x-2 h-[54px] overflow-hidden"
      >
        <LayoutGroup>
          <AnimatePresence>
            {members.map((member, i) => {
              return i < visibleIcons - 1 ? (
                <MemberIcon
                  userId={userId}
                  userRole={userRole}
                  member={member}
                  key={member.id}
                  align={i === 0 ? "start" : "center"}
                />
              ) : (
                i === visibleIcons - 1 && (
                  <motion.div variants={item} layout key={i}>
                    <Link href={`${pathname}/attendees`}>
                      <Button className="rounded-full z-30" key={i}>
                        +{members.length - visibleIcons + 1}
                      </Button>
                    </Link>
                  </motion.div>
                )
              );
            })}
          </AnimatePresence>
        </LayoutGroup>
      </motion.div>
      <Link href={`${pathname}/attendees`}>
        <span className="rounded-full z-30 text-primary hover:underline">
          View All
        </span>
      </Link>
    </div>
  );
}
