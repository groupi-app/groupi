'use server';

import { db } from "@/lib/db";

export async function getIsMod(userId: string, eventId: string) {
    const result = await db.membership.findFirst({
        where: {
            personId: userId,
            eventId: eventId,
            role: {
                in: ["MODERATOR", "ORGANIZER"]
            }
        }
    })
    if (result) return true
    return false
}