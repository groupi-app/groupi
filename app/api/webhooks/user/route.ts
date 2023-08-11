import { IncomingHttpHeaders } from "http";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook, WebhookRequiredHeaders } from "svix";

const webhookSecret = process.env.WEBHOOK_SECRET || "";

type EventType = "user.created" | "user.updated" | "user.deleted" | "*";

type Event = {
    data: Record<string, string | number>,
    object: "event",
    type: EventType,
}

async function handler(req: Request){

    const payload = await req.json();
    const headersList = headers();
    const heads = {
        "svix-id": headersList.get("svix-id"),
        "svix-timestamp": headersList.get("svix-timestamp"),
        "svix-signature": headersList.get("svix-signature"),
    }
    const wh = new Webhook(webhookSecret);
    let evt: Event | null = null;

    try {
        evt = wh.verify(JSON.stringify(payload), heads as IncomingHttpHeaders & WebhookRequiredHeaders) as Event;
    }
    catch (e) {
        console.error((e as Error).message);
        return NextResponse.json({}, { status: 400 });
    }

    const eventType: EventType = evt.type;
    if(eventType === "user.created") {
        const { id, ...attributes } = evt.data;
        console.log("User created", id, attributes);
    }
    else if(eventType === "user.updated") {

    }
    else if(eventType === "user.deleted") {
    
    }
    else {

    }


}

export const GET = handler;
export const POST = handler;
export const PUT = handler;