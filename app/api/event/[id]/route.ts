import { NextResponse } from "next/server";
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client'

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
            owner: true,
            memberships: true,
            potentialDateTimes: true,
            posts: true
        }
    });

    if (!result) {
        return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }
    
    return NextResponse.json(result, { status: 200 });
}

export async function DELETE(
    request: Request,
    context: { params: { id: string } }
) {
    const id = context.params.id

    //ToDo: More error handling?
    
    try {
        const result = await db.event.delete({
            where: {
                id: id
            }
        });

        return NextResponse.json(result, { status: 200 });

    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code === "P2025") {
                return NextResponse.json(
                    { message: `Event with id '${id}' not found` }, 
                    { status: 404 });
            }
        }
    }
}

//ToDo: Finish PATCH implementation