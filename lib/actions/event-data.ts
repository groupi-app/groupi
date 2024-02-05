'use server'

import { EventHeaderProps } from "@/components/event-header";
import { db } from "@/lib/db";
import { ActionResponse, PostWithAuthorInfo, UserInfo } from "@/types";
import { auth, clerkClient } from "@clerk/nextjs";
import { cache } from "react";

export interface EventData {
    posts: PostWithAuthorInfo[],
    isMod: boolean,
    userId: string,
    members: UserInfo[],
    headerData: EventHeaderProps
}

export const fetchEventData = cache(async(eventId: string): Promise<ActionResponse<EventData>> => {
    const event = await db.event.findUnique({
        where: {
            id: eventId
        },
        include: {
            posts: {
                include: {
                    replies: true
                }
            },
            memberships: true
        }
    });

    if (!event) return {error: "Event not found"}

    const { userId }: { userId: string | null } = auth();

    if (!userId) return {error: "User not found"}

    if (!event.memberships.find((membership) => (membership.personId === userId))) return {error: "You are not a member of this event"}

    const userRole = event.memberships.find((membership) => (membership.personId === userId ))?.role;

    if(!userRole) return {error: "Role not found"}

    const isMod = ["MODERATOR", "ORGANIZER"].includes(userRole);

    const membershipUsers = await clerkClient.users.getUserList({
        userId: event.memberships.map((membership) => membership.personId),
    });

    const members: UserInfo[] = membershipUsers.map((user) => {
    const role = event.memberships.find(
        (membership) => membership.personId === user.id
    )?.role;
    return {
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        avatar: user.imageUrl,
        role: role,
    };
    });
    
    let { posts }: { posts: PostWithAuthorInfo[] } = event;

    posts = posts.map((post) => {
    const author = membershipUsers.find(
      (author) => author.id === post.authorId
    );
    if (author) {
      post.authorInfo = {
        firstName: author.firstName,
        lastName: author.lastName,
        username: author.username,
        avatar: author.imageUrl,
      };
    }
    return {
      ...post,
    };
  });

    const headerData:EventHeaderProps = {
        eventTitle: event.title,
        eventDate: event.chosenDateTime,
        eventDescription: event.description,
        eventLocation: event.location,
    }
    
    return {success: {posts, isMod, userId, members, headerData}}
});