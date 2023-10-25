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
        return NextResponse.json({ message: `Event with id: ${id}, not found` }, { status: 404 });
    }
    
    return NextResponse.json(result, { status: 200 });
}

// ToDo: permissions
export async function DELETE(
    request: Request,
    context: { params: { id: string } }
) {
    const id = context.params.id

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
                    { message: `Event with id: ${id}, not found` }, 
                    { status: 404 });
            }
        }
    }
}

// ToDo: permissions
export async function PATCH(
    request: Request,
    context: { params: { id: string } }
) {
    const body = await request.json();
    const id = context.params.id;
    let result = null;

    // ToDo: Validations

    if (body.ownerId) {
        result = await db.event.update({
            where: {
                id: id
            },
            data: {
                updatedAt: body.updatedAt,
                owner: {
                    connect: {
                        id: body.ownerId
                    }
                },
                title: body.title,
                description: body.description,
                location: body.location,
                chosenDateTime: body.chosenDateTime,
                potentialDateTimes: body.potentialDateTimes,
                posts: body.posts,
                memberships: body.memberships
            }
        });
    }
    else {
        result = await db.event.update({
            where: {
                id: id
            },
            data: {
                updatedAt: body.updatedAt,
                title: body.title,
                description: body.description,
                location: body.location,
                chosenDateTime: body.chosenDateTime,
                potentialDateTimes: body.potentialDateTimes,
                posts: body.posts,
                memberships: body.memberships
            }
        });
    }

    return NextResponse.json(result, { status: 200 });
}
