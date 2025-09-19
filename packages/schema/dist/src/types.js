import { Prisma } from '@prisma/client';
const replyAuthorPost = Prisma.validator()({
    include: {
        replies: {
            include: {
                author: true,
            },
        },
        author: true,
    },
});
const replyAuthorEventPost = Prisma.validator()({
    include: {
        replies: {
            include: {
                author: true,
            },
        },
        author: true,
        event: {
            include: {
                memberships: {
                    include: {
                        person: true,
                    },
                },
            },
        },
    },
});
const member = Prisma.validator()({
    include: {
        person: true,
    },
});
const authorReply = Prisma.validator()({
    include: {
        author: true,
    },
});
const createdByInvite = Prisma.validator()({
    include: {
        createdBy: {
            include: {
                person: true,
            },
        },
    },
});
const eventInviteData = Prisma.validator()({
    include: {
        invites: {
            include: {
                createdBy: {
                    include: {
                        person: true,
                    },
                },
            },
        },
    },
});
const personData = Prisma.validator()({
    include: {
        memberships: true,
    },
});
const membershipEventWithMembers = Prisma.validator()({
    include: {
        event: {
            include: {
                memberships: {
                    include: {
                        person: true,
                    },
                },
            },
        },
    },
});
const eventWithMembers = Prisma.validator()({
    include: {
        memberships: {
            include: {
                person: true,
            },
        },
    },
});
const potentialDateTimeWithAvailabilities = Prisma.validator()({
    include: {
        availabilities: {
            include: {
                membership: {
                    include: {
                        person: true,
                    },
                },
            },
        },
        event: {
            include: {
                memberships: {
                    include: {
                        availabilities: true,
                    },
                },
            },
        },
    },
});
const membershipWithAvailabilities = Prisma.validator()({
    include: {
        person: true,
        availabilities: {
            include: {
                potentialDateTime: true,
            },
        },
        event: true,
    },
});
const notificationWithPersonEventPost = Prisma.validator()({
    include: {
        person: true,
        event: true,
        post: true,
        author: true,
    },
});
const settingsData = Prisma.validator()({
    include: {
        notificationMethods: {
            include: {
                notifications: true,
            },
        },
    },
});
