'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { SheetTitle } from '@/components/ui/sheet';
import { SheetContent } from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { EditorPanel } from './editor-panel';
import { PreviewPanel } from './preview-panel';

export function BuilderWorkspace() {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      {/* A normal-flow preview action stays reachable without covering fields. */}
      <div className='mb-3 flex justify-end xl:hidden'>
        <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
          <SheetTrigger asChild>
            <Button className='rounded-button' size='lg'>
              <Icons.eye className='mr-2 size-4' />
              Preview
            </Button>
          </SheetTrigger>
          <SheetContent side='bottom' className='h-[80dvh] overflow-y-auto p-0'>
            <SheetTitle className='px-4 pt-5 font-heading text-lg font-semibold'>
              Preview
            </SheetTitle>
            <PreviewPanel />
          </SheetContent>
        </Sheet>
      </div>
      {/* Desktop: side-by-side layout */}
      <div className='grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]'>
        {/* Editor */}
        <div className='min-w-0'>
          <EditorPanel />
        </div>

        {/* Preview — desktop only (sticky sidebar) */}
        <div className='hidden xl:block'>
          <div className='sticky top-4 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-card border bg-card'>
            <PreviewPanel />
          </div>
        </div>
      </div>
    </>
  );
}
