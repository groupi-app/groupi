import { NextResponse } from "next/server";
import { db } from '@/lib/db';

export async function POST(request: Request) {
    var body = await request.json();
    
    // ToDo: Validations

    const result = await db.event.create({
        data: {
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
        }
    });

    return NextResponse.json(result, { status: 200 });
}
