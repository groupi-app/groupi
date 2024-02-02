import { currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function GET(){
    const user = await currentUser();
    return NextResponse.json(user, { status: 200 });
}