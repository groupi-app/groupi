import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';
import { auth } from '@groupi/services/server';

const f = createUploadthing();

// UploadThing file router for avatar uploads
export const ourFileRouter = {
  avatarUploader: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      // Authenticate user with Better Auth - use direct API for third-party middleware
      const session = await auth.api.getSession({
        headers: req.headers,
      });

      if (!session?.user) {
        throw new UploadThingError('Unauthorized');
      }

      // Return userId as metadata
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This runs on the server after upload completes

      console.log('Avatar upload complete for userId:', metadata.userId);

      console.log('File URL:', file.url);

      // Return data to the client
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
