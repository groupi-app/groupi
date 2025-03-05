"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { acceptInvite } from "@/lib/actions/invite";
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

  return (
    <div>
      <Button
        onClick={async () => {
          const res = await acceptInvite({
            inviteId: inviteId,
            personId: personId,
          });
          if (res.error) {
            toast({
              title: "Error using invite",
              description: res.error,
            });
          } else if (res.success) {
            router.push(`/event/${eventId}`);
          }
        }}
      >
        Accept invite
      </Button>
    </div>
  );
}
