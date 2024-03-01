"use client";
import { useRef, useState, useLayoutEffect } from "react";
import MemberIcon from "@/components/member-icon";
import Link from "next/link";
import { Button } from "./ui/button";
import { Member } from "@/types";
import { usePathname } from "next/navigation";
import { useEventMembers } from "@/data/event-hooks";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { $Enums } from "@prisma/client";

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
                  key={i}
                  align={i === 0 ? "start" : "center"}
                />
              ) : (
                i === visibleIcons - 1 && (
                  <motion.div variants={item} layout key={i}>
                    <Link href={`${pathname}/members`}>
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
      <Link href={`${pathname}/members`}>
        <span className="rounded-full z-30 text-primary hover:underline">
          View All
        </span>
      </Link>
    </div>
  );
}
