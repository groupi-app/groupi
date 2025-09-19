export declare function createReply({ postId, text, authorId, }: {
    postId: string;
    text: string;
    authorId: string;
}): Promise<{
    success: {
        text: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        authorId: string;
        postId: string;
    };
    error?: undefined;
} | {
    error: unknown;
    success?: undefined;
}>;
export declare function updateReply({ replyId, text, }: {
    replyId: string;
    text: string;
}): Promise<{
    success: string;
    error?: undefined;
} | {
    error: unknown;
    success?: undefined;
}>;
export declare function deleteReply({ id }: {
    id: string;
}): Promise<{
    success: string;
    error?: undefined;
} | {
    error: unknown;
    success?: undefined;
}>;
