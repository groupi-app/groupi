import { NextResponse } from "next/server";
import { db } from '@/lib/db';
import { Post } from "@prisma/client";

export async function POST(request:Request) {
    const { title, content, eventId, authorId }:Post = await request.json();

    if(!title || !content || !eventId || !authorId) {
        return NextResponse.json({message: "Incomplete Request Object"}, {status: 400});
    }

    db.post.create({
        data: {
            title: title,
            content: content,
            eventId: eventId,
            authorId: authorId
        }
    });
}