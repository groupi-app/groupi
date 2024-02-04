import { NextResponse } from "next/server";
import { db } from '@/lib/db';
import { deletePost, updatePost } from "@/lib/actions/post";

export async function PATCH(request:Request, context: { params: { id: string } }) {
    const { id } = context.params;
    const { title, content, updatedAt } = await request.json();
    if(!title || !content) {
        return NextResponse.json({message: "Incomplete Request Object"}, {status: 400});
    }
    const res = await updatePost({id, title, content});
    if(res.error) {
        return NextResponse.json({message: res.error}, {status: 400});
    }
    return NextResponse.json({message: "Post Updated"}, {status: 200});

}

export async function DELETE(request:Request, context: { params: { id: string } }) {
    const { id } = context.params;
    const res = await deletePost({id});
    return NextResponse.json({message: "Post Deleted"}, {status: 200})
}