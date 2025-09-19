import { z } from 'zod';
import { PersonBasicDTO, createPersonBasicDTO } from './person';
import { InviteSchema, EventSchema, MembershipSchema } from '../generated';
// Event invite DTO - for individual invite entries in invite lists
export const EventInviteDTO = InviteSchema.pick({
    id: true,
    name: true,
    eventId: true,
    createdById: true,
    expiresAt: true,
    usesRemaining: true,
    maxUses: true,
    createdAt: true,
}).extend({
    createdBy: MembershipSchema.pick({
        id: true,
    }).extend({
        person: PersonBasicDTO,
    }),
});
// Event invite management DTO - for invite management page showing all invites
export const EventInviteManagementDTO = EventSchema.pick({
    id: true,
    title: true,
    description: true,
    location: true,
    chosenDateTime: true,
    createdAt: true,
    updatedAt: true,
}).extend({
    invites: z.array(EventInviteDTO),
    memberships: z.array(MembershipSchema.pick({
        id: true,
        role: true,
        rsvpStatus: true,
        personId: true,
        eventId: true,
    })),
});
// Individual invite page DTO - for showing invite details with full event info
export const IndividualInviteDTO = EventInviteDTO.extend({
    event: EventSchema.pick({
        id: true,
        title: true,
        description: true,
        location: true,
        chosenDateTime: true,
    }).extend({
        memberCount: z.number(),
    }),
});
// Factory functions
export function createEventInviteDTO(invite) {
    return {
        id: invite.id,
        name: invite.name,
        eventId: invite.eventId,
        createdById: invite.createdById,
        expiresAt: invite.expiresAt,
        usesRemaining: invite.usesRemaining,
        maxUses: invite.maxUses,
        createdAt: invite.createdAt,
        createdBy: {
            id: invite.createdBy.id,
            person: createPersonBasicDTO(invite.createdBy.person),
        },
    };
}
export function createEventInviteManagementDTO(event) {
    return {
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        chosenDateTime: event.chosenDateTime,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        invites: event.invites.map(invite => createEventInviteDTO(invite)),
        memberships: event.memberships.map(membership => ({
            id: membership.id,
            role: membership.role,
            rsvpStatus: membership.rsvpStatus,
            personId: membership.personId,
            eventId: membership.eventId,
        })),
    };
}
// Factory function for individual invite page
export function createIndividualInviteDTO(invite) {
    return {
        id: invite.id,
        name: invite.name,
        eventId: invite.eventId,
        createdById: invite.createdById,
        expiresAt: invite.expiresAt,
        usesRemaining: invite.usesRemaining,
        maxUses: invite.maxUses,
        createdAt: invite.createdAt,
        createdBy: {
            id: invite.createdBy.id,
            person: createPersonBasicDTO(invite.createdBy.person),
        },
        event: {
            id: invite.event.id,
            title: invite.event.title,
            description: invite.event.description,
            location: invite.event.location,
            chosenDateTime: invite.event.chosenDateTime,
            memberCount: invite.event.memberships.length,
        },
    };
}
