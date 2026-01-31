'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { RefObject } from 'react';

export function PostStickyHeader({
  postTitle,
  postRef,
}: {
  postTitle: string;
  postRef: RefObject<HTMLDivElement | null>;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const headerRef = useRef(null);

  useEffect(() => {
    const checkVisibility = () => {
      if (!postRef.current) {
        setIsVisible(false);
        return;
      }

      const rect = postRef.current.getBoundingClientRect();
      // If post is scrolled above viewport, show sticky header
      setIsVisible(rect.bottom < 0);
    };

    checkVisibility();
    window.addEventListener('scroll', checkVisibility, { passive: true });
    window.addEventListener('resize', checkVisibility, { passive: true });

    return () => {
      window.removeEventListener('scroll', checkVisibility);
      window.removeEventListener('resize', checkVisibility);
    };
  }, [postRef]);

  const scrollToPost = () => {
    postRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!isVisible) return null;

  return (
    <div
      ref={headerRef}
      className={cn(
        'sticky top-2 z-top bg-background border border-border rounded-md shadow-raised',
        'animate-in fade-in slide-in-from-top-2',
        'mx-auto max-w-4xl px-4'
      )}
    >
      <div className='py-2 flex items-center justify-between'>
        <h2 className='text-sm font-medium truncate flex-1 mr-4'>
          {postTitle}
        </h2>
        <Button
          onClick={scrollToPost}
          size='sm'
          variant='ghost'
          className='shrink-0'
        >
          <Icons.up className='h-4 w-4 mr-2' />
          Jump to Post
        </Button>
      </div>
    </div>
  );
}
