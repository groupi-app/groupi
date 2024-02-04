'use server'

import { revalidatePath } from "next/cache";
import { db } from "../db";
import { auth, clerkClient } from "@clerk/nextjs";
import { Post } from "@prisma/client";
import { UserInfo } from "@/types";

export interface PostData {
    success?: {
        post: Post,
        eventTitle: string,
        userId: string,
        isMod: boolean,
        userRole: string,
        authorInfo: UserInfo
    }
    error?: string
}

export async function fetchPostData(postId: string): Promise<PostData> {
    const post = await db.post.findUnique({
        where: {
            id: postId
        },
        include: {
            replies: true,
            event: {
                include: {
                    memberships: true
                }
            }
        }
    });

    if (!post) return {error: "Post not found"}

    const { userId }: { userId: string | null } = auth();

    if (!userId) return {error: "User not found"}

    if (!post.event.memberships.find((membership) => (membership.personId === userId))) return {error: "You are not a member of this event"}

    const userRole = post.event.memberships.find((membership) => (membership.personId === userId ))?.role;

    if(!userRole) return {error: "Role not found"}

    const isMod = ["MODERATOR", "ORGANIZER"].includes(userRole);

    const authorUser = await clerkClient.users.getUser(post.authorId);

    const authorInfo: UserInfo = {
        firstName: authorUser.firstName,
        lastName: authorUser.lastName,
        username: authorUser.username,
        avatar: authorUser.imageUrl
    }

    const eventTitle = post.event.title;

    return {
        success: {
            post,
            eventTitle,
            userId,
            isMod,
            userRole,
            authorInfo
        }
    }
}

export async function createPost({title, content, eventId, authorId}: {title: string, content: string, eventId: string, authorId: string}) {
    try {
        const res = await db.post.create({
        data: {
            title: title,
            content: content,
            eventId: eventId,
            authorId: authorId
        },
    })
    revalidatePath("/");
    return {success: "Post Created"}
} catch(error) {
        return {error: error}
    };
    

}

export async function updatePost({id, title, content}: {id: string, title: string, content: string}) {
    try {
    const res = await db.post.update({
        where: {
            id: id
        },
        data: {
            title: title,
            content: content,
            updatedAt: new Date().toISOString()
        }
    })
    revalidatePath("/");
    return {success: "Post Updated"}
    }
     catch (error) {
        return {error: error}
    };
    
}

export async function deletePost({id}: {id: string}) {
    try {
        const res = await db.post.delete({
        where: {
            id: id
        }
    });
    revalidatePath("/");
    return {success: "Post Deleted"}
    }
    catch(error) {
        return {error: error}
    };
    
}