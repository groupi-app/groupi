import { z } from 'zod';
import { MembershipSchema, PotentialDateTimeSchema, AvailabilitySchema, } from '../generated';
import { PersonBasicDTO } from './person';
// Date selection availability DTO - for showing who's available for each potential date
export const DateSelectionAvailabilityDTO = AvailabilitySchema.pick({
    potentialDateTimeId: true,
    status: true,
}).extend({
    membership: MembershipSchema.pick({
        id: true,
    }).extend({
        person: PersonBasicDTO,
    }),
});
// Date option DTO - for date selection interface showing all potential dates
export const DateOptionDTO = PotentialDateTimeSchema.pick({
    id: true,
    dateTime: true,
}).extend({
    availabilities: z.array(DateSelectionAvailabilityDTO),
});
// Event member availability DTO - for showing a member's availability across all dates
export const EventMemberAvailabilityDTO = MembershipSchema.pick({
    id: true,
    role: true,
    rsvpStatus: true,
}).extend({
    person: PersonBasicDTO,
    availabilities: z.array(AvailabilitySchema.pick({
        potentialDateTimeId: true,
        status: true,
    })),
});
// Factory functions
export function createDateOptionDTO(pdt) {
    return {
        id: pdt.id,
        dateTime: pdt.dateTime,
        availabilities: pdt.availabilities.map(availability => ({
            potentialDateTimeId: availability.potentialDateTimeId,
            status: availability.status,
            membership: {
                id: availability.membership.id,
                person: {
                    id: availability.membership.person.id,
                    firstName: availability.membership.person.firstName,
                    lastName: availability.membership.person.lastName,
                    username: availability.membership.person.username,
                    imageUrl: availability.membership.person.imageUrl,
                },
            },
        })),
    };
}
export function createEventMemberAvailabilityDTO(member) {
    return {
        id: member.id,
        role: member.role,
        rsvpStatus: member.rsvpStatus,
        person: {
            id: member.person.id,
            firstName: member.person.firstName,
            lastName: member.person.lastName,
            username: member.person.username,
            imageUrl: member.person.imageUrl,
        },
        availabilities: member.availabilities.map(availability => ({
            potentialDateTimeId: availability.potentialDateTimeId,
            status: availability.status,
        })),
    };
}
