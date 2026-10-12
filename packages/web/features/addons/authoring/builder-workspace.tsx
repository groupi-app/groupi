'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { SheetContent } from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { EditorPanel } from './editor-panel';
import { PreviewPanel } from './preview-panel';

export function BuilderWorkspace() {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      {/* Desktop: side-by-side layout */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]'>
        {/* Editor */}
        <div className='min-w-0'>
          <EditorPanel />
        </div>

        {/* Preview — desktop only (sticky sidebar) */}
        <div className='hidden lg:block'>
          <div className='sticky top-4 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-card border bg-card'>
            <PreviewPanel />
          </div>
        </div>
      </div>

      {/* Mobile: floating preview button + Sheet */}
      <div className='fixed bottom-6 right-6 lg:hidden z-float'>
        <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
          <SheetTrigger asChild>
            <Button className='rounded-button shadow-floating' size='lg'>
              <Icons.eye className='mr-2 size-4' />
              Preview
            </Button>
          </SheetTrigger>
          <SheetContent side='bottom' className='h-[80vh] overflow-y-auto p-0'>
            <PreviewPanel />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
