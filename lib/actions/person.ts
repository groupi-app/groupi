import { auth } from "@clerk/nextjs";
import { db } from "../db";
import { cache } from "react";
import { ActionResponse, PersonData } from "@/types";

export const fetchPersonData = cache(
  async (userId: string): Promise<ActionResponse<PersonData>> => {
    if (!userId) return { error: "User not found" };

    const person = await db.person.findUnique({
      where: { id: userId },
      include: {
        events: { include: { owner: true } },
      },
    });

    if (!person) return { error: "User not found" };

    return { success: person };
  }
);
