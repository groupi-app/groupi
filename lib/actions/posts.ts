'use server'

import { db } from "@/lib/db";
import { PostWithAuthorInfo } from "@/types";
import { auth, clerkClient } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";

export async function fetchPosts(eventId: string) {
    const event = await db.event.findUnique({
        where: {
            id: eventId
        },
        include: {
            posts: {
                include: {
                    replies: true
                }
            },
            memberships: true
        }
    });

    if (!event) return {error: "Event not found"}

    const { userId }: { userId: string | null } = auth();

    if (!userId) return {error: "User not found"}

    const userRole = event.memberships.find((membership) => (membership.personId === userId ))?.role;

    if(!userRole) return {error: "Role not found"}

    const isMod = ["MODERATOR", "ORGANIZER"].includes(userRole);

    const membershipUsers = await clerkClient.users.getUserList({
        userId: event.memberships.map((membership) => membership.personId),
    });
    
    let { posts }: { posts: PostWithAuthorInfo[] } = event;

    posts = posts.map((post) => {
    const author = membershipUsers.find(
      (author) => author.id === post.authorId
    );
    if (author) {
      post.authorInfo = {
        firstName: author.firstName,
        lastName: author.lastName,
        username: author.username,
        avatar: author.imageUrl,
      };
    }
    return {
      ...post,
    };
  });



    if (!posts) return {error: "No posts"}
    if (posts) return {success: {posts, isMod, userId}}
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