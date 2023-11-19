import { NextResponse } from "next/server";
import { db } from '@/lib/db';

export async function PATCH(request:Request, context: { params: { id: string } }) {
    const { id } = context.params;
    const { title, content } = await request.json();
    if(!title || !content) {
        return NextResponse.json({message: "Incomplete Request Object"}, {status: 400});
    }
    
    const res = await db.post.update({
        where: {
            id: id
        },
        data: {
            title: title,
            content: content
        },
    });

}