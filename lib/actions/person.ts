import { ActionResponse, PersonData } from "@/types";
import { cache } from "react";
import { db } from "../db";

export const fetchPersonData = cache(
  async (userId: string): Promise<ActionResponse<PersonData>> => {
    if (!userId) return { error: "User not found" };

    const person = await db.person.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            event: { include: { memberships: { include: { person: true } } } },
          },
        },
      },
    });

    if (!person) return { error: "User not found" };

    return { success: person };
  }
);
