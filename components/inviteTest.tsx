"use client";
import { createInvite } from "@/lib/actions/invite";
import { currentUser } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { useToast } from "@/components/ui/use-toast";

export function inviteTest() {
  const { toast } = useToast();
  async function onSubmit() {
    const user = await currentUser();
    const userId = user ? user.id : "";
    const res = await createInvite({
      eventId: "1",
      createdById: userId,
      uses: null,
      expiresAt: null,
    });
    if (res.success) {
      toast({
        title: "Invite created",
        description: "Your invite has been successfully created.",
      });
    }
  } // onSubmit

  return (
    <div className="container">
      <h1 className="text-foreground">Invite test</h1>
      <Button>Create invite</Button>
    </div>
  );
} // inviteTest
