import { UTApi } from 'uploadthing/server';
import { auth } from '@groupi/services/server';
import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';

const logger = createLogger('uploadthing-delete');

export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated - use direct API for Route Handlers with request object
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fileKey } = body;

    if (!fileKey || typeof fileKey !== 'string') {
      return NextResponse.json({ error: 'Invalid file key' }, { status: 400 });
    }

    // Delete the file from UploadThing
    const utapi = new UTApi();
    const result = await utapi.deleteFiles(fileKey);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    logger.error({ error }, 'Error deleting file from UploadThing');
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
