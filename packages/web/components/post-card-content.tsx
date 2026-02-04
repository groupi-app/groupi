'use client';
import { useIsOverflowing } from '@/lib/use-is-overflow';

// Strip leading and trailing empty paragraph tags that BlockNote adds
const stripEmptyParagraphs = (html: string): string => {
  return html
    .replace(/^(<p>(\s|&nbsp;)*<\/p>)+/gi, '') // Remove leading empty paragraphs
    .replace(/(<p>(\s|&nbsp;)*<\/p>)+$/gi, '') // Remove trailing empty paragraphs
    .trim();
};

export function PostCardContent({ content }: { content: string }) {
  const [ref, isOverflowing] = useIsOverflowing();
  const cleanContent = stripEmptyParagraphs(content);

  return (
    <>
      <div
        className='prose prose-sm dark:prose-invert max-w-none max-h-[120px] overflow-hidden whitespace-pre-wrap'
        ref={ref}
        dangerouslySetInnerHTML={{
          __html: cleanContent,
        }}
      />
      {isOverflowing && (
        <div className='text-muted-foreground'>Open to see full post...</div>
      )}
    </>
  );
}
