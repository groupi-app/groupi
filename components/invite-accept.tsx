"use client";

import { Button } from "@/components/ui/button";
import { Icons } from "./icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useInvite } from "@/lib/actions/invite";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export function AcceptInviteButton({
  inviteId,
  eventId,
  personId,
}: {
  //   params: { eventId: string };
  inviteId: string;
  eventId: string;
  personId: string;
}) {
  const { toast } = useToast();
  const router = useRouter();

  async function onClick() {
    const res = await useInvite({
      inviteId: inviteId,
      personId: personId,
    });
    if ("error" in res) {
      toast({
        title: "Error using invite",
        description: res.error,
      });
    } else {
      router.push(`/event/${eventId}`);
    }
  }

  return (
    <div>
      <Button onClick={onClick}>Accept invite</Button>
    </div>
  );
}
