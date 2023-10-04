import { NextResponse } from "next/server";
import { db } from '@/lib/db';

export async function GET(
    request: Request,
    context: { params: { id: string } }
) {
    const id = context.params.id

    const result = await db.event.findUnique({
        where: {
            id: id,
        },
        include : {
            memberships: true
        }
    })

    if (!result) {
        return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }
    
    return NextResponse.json(result, { status: 200 });
}