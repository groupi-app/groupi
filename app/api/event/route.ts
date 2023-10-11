import { NextResponse } from "next/server";
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client'

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const result = await db.event.create({
            data: {
                createdAt: body.createdAt,
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

        return NextResponse.json(result, { status: 200 });
        
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            console.log(e);
            return NextResponse.json({ message: e } , { status: 400 });
        }
    }
}