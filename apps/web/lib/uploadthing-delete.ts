import { UTApi } from 'uploadthing/server';

const utapi = new UTApi();

export async function deleteUploadThingFile(fileKey: string) {
  try {
    await utapi.deleteFiles(fileKey);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete file from UploadThing:', error);
    return { success: false, error };
  }
}
