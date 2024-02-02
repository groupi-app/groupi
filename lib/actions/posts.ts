'use server'

import { db } from "@/lib/db";

export async function fetchPosts(eventId: string) {
    const posts = await db.post.findMany({
        where: {
            eventId: eventId
        },
        include: {
            replies: true,
        }
    })
    if (!posts) return {error: "No posts"}
    if (posts) return {success: posts}
}