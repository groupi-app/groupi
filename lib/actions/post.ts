'use server'

import { revalidatePath } from "next/cache";
import { db } from "../db";

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