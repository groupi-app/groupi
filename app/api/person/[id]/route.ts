import { NextResponse } from "next/server";
import { db } from '../../../../lib/db';

export async function GET(
    request: Request,
    context: { params: { id: string } }
) {
    const result = await db.person.findUnique({
        where: {
            id: context.params.id,
        },
    })
    return NextResponse.json({ message: result }, { status: 200 });
}