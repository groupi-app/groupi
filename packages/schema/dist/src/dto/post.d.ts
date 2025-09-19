import { z } from 'zod';
import type { Post as PrismaPost, Person, Reply } from '../generated';
export declare const PostCardDTO: z.ZodObject<Pick<{
    id: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    editedAt: z.ZodDate;
    authorId: z.ZodString;
    eventId: z.ZodString;
    title: z.ZodString;
    content: z.ZodString;
}, "id" | "createdAt" | "title" | "eventId" | "editedAt" | "authorId" | "content"> & {
    author: z.ZodObject<Pick<{
        id: z.ZodString;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        firstName: z.ZodNullable<z.ZodString>;
        lastName: z.ZodNullable<z.ZodString>;
        username: z.ZodString;
        imageUrl: z.ZodString;
    }, "id" | "firstName" | "lastName" | "username" | "imageUrl">, "strip", z.ZodTypeAny, {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    }, {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    }>;
    replyCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    title: string;
    eventId: string;
    editedAt: Date;
    authorId: string;
    content: string;
    author: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    };
    replyCount: number;
}, {
    id: string;
    createdAt: Date;
    title: string;
    eventId: string;
    editedAt: Date;
    authorId: string;
    content: string;
    author: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    };
    replyCount: number;
}>;
export type PostCardDTO = z.infer<typeof PostCardDTO>;
export declare const PostPageDTO: z.ZodObject<Pick<{
    id: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    editedAt: z.ZodDate;
    authorId: z.ZodString;
    eventId: z.ZodString;
    title: z.ZodString;
    content: z.ZodString;
}, "id" | "createdAt" | "title" | "eventId" | "editedAt" | "authorId" | "content"> & {
    author: z.ZodObject<Pick<{
        id: z.ZodString;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        firstName: z.ZodNullable<z.ZodString>;
        lastName: z.ZodNullable<z.ZodString>;
        username: z.ZodString;
        imageUrl: z.ZodString;
    }, "id" | "firstName" | "lastName" | "username" | "imageUrl">, "strip", z.ZodTypeAny, {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    }, {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    }>;
    replyCount: z.ZodNumber;
} & {
    replies: z.ZodArray<z.ZodObject<Pick<{
        id: z.ZodString;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        authorId: z.ZodString;
        postId: z.ZodString;
        text: z.ZodString;
    }, "id" | "createdAt" | "text"> & {
        author: z.ZodObject<Pick<{
            id: z.ZodString;
            createdAt: z.ZodDate;
            updatedAt: z.ZodDate;
            firstName: z.ZodNullable<z.ZodString>;
            lastName: z.ZodNullable<z.ZodString>;
            username: z.ZodString;
            imageUrl: z.ZodString;
        }, "id" | "firstName" | "lastName" | "username" | "imageUrl">, "strip", z.ZodTypeAny, {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        }, {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: Date;
        text: string;
        author: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        };
    }, {
        id: string;
        createdAt: Date;
        text: string;
        author: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        };
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    title: string;
    eventId: string;
    editedAt: Date;
    authorId: string;
    content: string;
    replies: {
        id: string;
        createdAt: Date;
        text: string;
        author: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        };
    }[];
    author: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    };
    replyCount: number;
}, {
    id: string;
    createdAt: Date;
    title: string;
    eventId: string;
    editedAt: Date;
    authorId: string;
    content: string;
    replies: {
        id: string;
        createdAt: Date;
        text: string;
        author: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        };
    }[];
    author: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    };
    replyCount: number;
}>;
export type PostPageDTO = z.infer<typeof PostPageDTO>;
export declare const PostReplyFeedDTO: z.ZodObject<Pick<{
    id: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    editedAt: z.ZodDate;
    authorId: z.ZodString;
    eventId: z.ZodString;
    title: z.ZodString;
    content: z.ZodString;
}, "id" | "createdAt" | "title" | "eventId" | "editedAt" | "authorId" | "content"> & {
    author: z.ZodObject<Pick<{
        id: z.ZodString;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        firstName: z.ZodNullable<z.ZodString>;
        lastName: z.ZodNullable<z.ZodString>;
        username: z.ZodString;
        imageUrl: z.ZodString;
    }, "id" | "firstName" | "lastName" | "username" | "imageUrl">, "strip", z.ZodTypeAny, {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    }, {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    }>;
    replyCount: z.ZodNumber;
} & {
    replies: z.ZodArray<z.ZodObject<Pick<{
        id: z.ZodString;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        authorId: z.ZodString;
        postId: z.ZodString;
        text: z.ZodString;
    }, "id" | "createdAt" | "text"> & {
        author: z.ZodObject<Pick<{
            id: z.ZodString;
            createdAt: z.ZodDate;
            updatedAt: z.ZodDate;
            firstName: z.ZodNullable<z.ZodString>;
            lastName: z.ZodNullable<z.ZodString>;
            username: z.ZodString;
            imageUrl: z.ZodString;
        }, "id" | "firstName" | "lastName" | "username" | "imageUrl">, "strip", z.ZodTypeAny, {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        }, {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: Date;
        text: string;
        author: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        };
    }, {
        id: string;
        createdAt: Date;
        text: string;
        author: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        };
    }>, "many">;
} & {
    event: z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        chosenDateTime: z.ZodNullable<z.ZodDate>;
        memberships: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            role: z.ZodEnum<["ORGANIZER", "MODERATOR", "ATTENDEE"]>;
            rsvpStatus: z.ZodEnum<["ORGANIZER", "MODERATOR", "ATTENDEE"]>;
            personId: z.ZodString;
            eventId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            personId: string;
            eventId: string;
            role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
            rsvpStatus: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        }, {
            id: string;
            personId: string;
            eventId: string;
            role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
            rsvpStatus: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        id: string;
        title: string;
        chosenDateTime: Date | null;
        memberships: {
            id: string;
            personId: string;
            eventId: string;
            role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
            rsvpStatus: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        }[];
    }, {
        id: string;
        title: string;
        chosenDateTime: Date | null;
        memberships: {
            id: string;
            personId: string;
            eventId: string;
            role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
            rsvpStatus: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    title: string;
    eventId: string;
    editedAt: Date;
    authorId: string;
    content: string;
    replies: {
        id: string;
        createdAt: Date;
        text: string;
        author: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        };
    }[];
    event: {
        id: string;
        title: string;
        chosenDateTime: Date | null;
        memberships: {
            id: string;
            personId: string;
            eventId: string;
            role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
            rsvpStatus: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        }[];
    };
    author: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    };
    replyCount: number;
}, {
    id: string;
    createdAt: Date;
    title: string;
    eventId: string;
    editedAt: Date;
    authorId: string;
    content: string;
    replies: {
        id: string;
        createdAt: Date;
        text: string;
        author: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        };
    }[];
    event: {
        id: string;
        title: string;
        chosenDateTime: Date | null;
        memberships: {
            id: string;
            personId: string;
            eventId: string;
            role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
            rsvpStatus: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        }[];
    };
    author: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    };
    replyCount: number;
}>;
export type PostReplyFeedDTO = z.infer<typeof PostReplyFeedDTO>;
export type PostWithReplies = PrismaPost & {
    author: Person;
    replies: Array<Reply & {
        author: Person;
    }>;
};
export type PostWithEvent = PrismaPost & {
    author: Person;
    replies: Array<Reply & {
        author: Person;
    }>;
    event: {
        id: string;
        title: string;
        chosenDateTime: Date | null;
        memberships: Array<{
            id: string;
            role: string;
            rsvpStatus: string;
            personId: string;
            eventId: string;
        }>;
    };
};
export declare function createPostCardDTO(post: PrismaPost & {
    author: Person;
    replies: Reply[];
}): PostCardDTO;
export declare function createPostPageDTO(postWithReplies: PostWithReplies): PostPageDTO;
export declare function createPostReplyFeedDTO(postWithEvent: PostWithEvent): PostReplyFeedDTO;
export declare const PostWithRepliesDTO: z.ZodObject<Pick<{
    id: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    editedAt: z.ZodDate;
    authorId: z.ZodString;
    eventId: z.ZodString;
    title: z.ZodString;
    content: z.ZodString;
}, "id" | "createdAt" | "title" | "eventId" | "editedAt" | "authorId" | "content"> & {
    author: z.ZodObject<Pick<{
        id: z.ZodString;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        firstName: z.ZodNullable<z.ZodString>;
        lastName: z.ZodNullable<z.ZodString>;
        username: z.ZodString;
        imageUrl: z.ZodString;
    }, "id" | "firstName" | "lastName" | "username" | "imageUrl">, "strip", z.ZodTypeAny, {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    }, {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    }>;
    replyCount: z.ZodNumber;
} & {
    replies: z.ZodArray<z.ZodObject<Pick<{
        id: z.ZodString;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        authorId: z.ZodString;
        postId: z.ZodString;
        text: z.ZodString;
    }, "id" | "createdAt" | "text"> & {
        author: z.ZodObject<Pick<{
            id: z.ZodString;
            createdAt: z.ZodDate;
            updatedAt: z.ZodDate;
            firstName: z.ZodNullable<z.ZodString>;
            lastName: z.ZodNullable<z.ZodString>;
            username: z.ZodString;
            imageUrl: z.ZodString;
        }, "id" | "firstName" | "lastName" | "username" | "imageUrl">, "strip", z.ZodTypeAny, {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        }, {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: Date;
        text: string;
        author: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        };
    }, {
        id: string;
        createdAt: Date;
        text: string;
        author: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        };
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    title: string;
    eventId: string;
    editedAt: Date;
    authorId: string;
    content: string;
    replies: {
        id: string;
        createdAt: Date;
        text: string;
        author: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        };
    }[];
    author: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    };
    replyCount: number;
}, {
    id: string;
    createdAt: Date;
    title: string;
    eventId: string;
    editedAt: Date;
    authorId: string;
    content: string;
    replies: {
        id: string;
        createdAt: Date;
        text: string;
        author: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        };
    }[];
    author: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    };
    replyCount: number;
}>;
export type PostWithRepliesDTO = PostPageDTO;
export declare const PostWithEventDTO: z.ZodObject<Pick<{
    id: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    editedAt: z.ZodDate;
    authorId: z.ZodString;
    eventId: z.ZodString;
    title: z.ZodString;
    content: z.ZodString;
}, "id" | "createdAt" | "title" | "eventId" | "editedAt" | "authorId" | "content"> & {
    author: z.ZodObject<Pick<{
        id: z.ZodString;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        firstName: z.ZodNullable<z.ZodString>;
        lastName: z.ZodNullable<z.ZodString>;
        username: z.ZodString;
        imageUrl: z.ZodString;
    }, "id" | "firstName" | "lastName" | "username" | "imageUrl">, "strip", z.ZodTypeAny, {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    }, {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    }>;
    replyCount: z.ZodNumber;
} & {
    replies: z.ZodArray<z.ZodObject<Pick<{
        id: z.ZodString;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        authorId: z.ZodString;
        postId: z.ZodString;
        text: z.ZodString;
    }, "id" | "createdAt" | "text"> & {
        author: z.ZodObject<Pick<{
            id: z.ZodString;
            createdAt: z.ZodDate;
            updatedAt: z.ZodDate;
            firstName: z.ZodNullable<z.ZodString>;
            lastName: z.ZodNullable<z.ZodString>;
            username: z.ZodString;
            imageUrl: z.ZodString;
        }, "id" | "firstName" | "lastName" | "username" | "imageUrl">, "strip", z.ZodTypeAny, {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        }, {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: Date;
        text: string;
        author: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        };
    }, {
        id: string;
        createdAt: Date;
        text: string;
        author: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        };
    }>, "many">;
} & {
    event: z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        chosenDateTime: z.ZodNullable<z.ZodDate>;
        memberships: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            role: z.ZodEnum<["ORGANIZER", "MODERATOR", "ATTENDEE"]>;
            rsvpStatus: z.ZodEnum<["ORGANIZER", "MODERATOR", "ATTENDEE"]>;
            personId: z.ZodString;
            eventId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            personId: string;
            eventId: string;
            role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
            rsvpStatus: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        }, {
            id: string;
            personId: string;
            eventId: string;
            role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
            rsvpStatus: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        id: string;
        title: string;
        chosenDateTime: Date | null;
        memberships: {
            id: string;
            personId: string;
            eventId: string;
            role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
            rsvpStatus: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        }[];
    }, {
        id: string;
        title: string;
        chosenDateTime: Date | null;
        memberships: {
            id: string;
            personId: string;
            eventId: string;
            role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
            rsvpStatus: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    title: string;
    eventId: string;
    editedAt: Date;
    authorId: string;
    content: string;
    replies: {
        id: string;
        createdAt: Date;
        text: string;
        author: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        };
    }[];
    event: {
        id: string;
        title: string;
        chosenDateTime: Date | null;
        memberships: {
            id: string;
            personId: string;
            eventId: string;
            role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
            rsvpStatus: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        }[];
    };
    author: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    };
    replyCount: number;
}, {
    id: string;
    createdAt: Date;
    title: string;
    eventId: string;
    editedAt: Date;
    authorId: string;
    content: string;
    replies: {
        id: string;
        createdAt: Date;
        text: string;
        author: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            imageUrl: string;
        };
    }[];
    event: {
        id: string;
        title: string;
        chosenDateTime: Date | null;
        memberships: {
            id: string;
            personId: string;
            eventId: string;
            role: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
            rsvpStatus: "ORGANIZER" | "MODERATOR" | "ATTENDEE";
        }[];
    };
    author: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    };
    replyCount: number;
}>;
export type PostWithEventDTO = PostReplyFeedDTO;
export declare const createPostWithRepliesDTO: typeof createPostPageDTO;
export declare const createPostWithEventDTO: typeof createPostReplyFeedDTO;
