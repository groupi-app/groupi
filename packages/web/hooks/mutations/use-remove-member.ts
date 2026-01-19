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

export function useRemoveMember() {
  const removeMember = useMutation(eventMutations.removeMember);

  return useCallback(async (membershipId: Id<"memberships">) => {
    try {
      const result = await removeMember({
        membershipId,
      });

      toast.success("Member removed from event");
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove member';
      toast.error(message);
      throw error;
    }
  }, [removeMember]);
}
