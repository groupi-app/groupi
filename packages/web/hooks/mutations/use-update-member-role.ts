"use client";

import { useMutation } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { useCallback } from "react";
import { toast } from "sonner";

// Dynamic require to avoid deep type instantiation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let eventMutations: any;
function initApi() {
  if (!eventMutations) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require("@/convex/_generated/api");
    eventMutations = api.events?.mutations ?? {};
  }
}
initApi();

export function useUpdateMemberRole() {
  const updateMemberRole = useMutation(eventMutations.updateMemberRole);

  return useCallback(async (membershipId: Id<"memberships">, newRole: "ORGANIZER" | "MODERATOR" | "ATTENDEE") => {
    try {
      const result = await updateMemberRole({
        membershipId,
        newRole,
      });

      toast.success(`Member role updated to ${newRole.toLowerCase()}`);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update member role';
      toast.error(message);
      throw error;
    }
  }, [updateMemberRole]);
}
