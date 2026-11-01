import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

// Keep preview/dev behavior equivalent to static hosting for raw agent documents.
function rawDocuments(root: string) {
  return async (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void
  ) => {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
    if (!pathname.endsWith('.md') && pathname !== '/llms.txt') return next();
    let path: string;
    try {
      path = resolve(root, '.' + decodeURIComponent(pathname));
    } catch {
      response.statusCode = 400;
      response.end('Invalid path');
      return;
    }
    if (!path.startsWith(resolve(root) + sep)) {
      response.statusCode = 404;
      response.end('Document not found');
      return;
    }
    try {
      const document = await readFile(path);
      response.setHeader(
        'Content-Type',
        pathname.endsWith('.md')
          ? 'text/markdown; charset=utf-8'
          : 'text/plain; charset=utf-8'
      );
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.end(request.method === 'HEAD' ? undefined : document);
    } catch {
      response.statusCode = 404;
      response.setHeader('Content-Type', 'text/plain; charset=utf-8');
      response.end('Document not found');
    }
  };
}
const rawDocumentPlugin: Plugin = {
  name: 'raw-public-documents',
  configureServer(server) {
    server.middlewares.use(rawDocuments(server.config.publicDir));
  },
  configurePreviewServer(server) {
    server.middlewares.use(
      rawDocuments(resolve(server.config.root, server.config.build.outDir))
    );
  },
};
export default defineConfig({
  plugins: [react(), rawDocumentPlugin],
  test: { environment: 'jsdom', setupFiles: ['./tests/setup.ts'] },
});
