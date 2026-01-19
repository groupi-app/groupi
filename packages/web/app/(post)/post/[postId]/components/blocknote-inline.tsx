'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */
// Props defined for API compatibility but not yet used in implementation

import React, { useCallback, useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import { useTheme } from 'next-themes';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/shadcn/style.css';

import { cn } from '@/lib/utils';
import { Id } from '@/convex/_generated/dataModel';

// Strip leading and trailing empty paragraph tags that BlockNote adds
const stripEmptyParagraphs = (html: string): string => {
  return html
    .replace(/^(<p>(\s|&nbsp;)*<\/p>)+/gi, '') // Remove leading empty paragraphs
    .replace(/(<p>(\s|&nbsp;)*<\/p>)+$/gi, '') // Remove trailing empty paragraphs
    .trim();
};

// Type definitions for members - simplified from the current Tiptap implementation
type Member = {
  personId: string;
  person: {
    user: {
      id: string;
      name?: string;
      email: string;
      image?: string;
      username?: string;
    } | null;
  };
};

interface BlockNoteInlineProps {
  content: string;
  placeholder: string;
  onChange: (richText: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  preventEnterSubmit?: boolean;
  growUpward?: boolean;
  eventId?: Id<'events'>;
  members?: Member[];
  isMobile?: boolean;
}

export interface BlockNoteInlineHandle {
  clear: () => void;
  focus: () => void;
}

function BlockNoteInlineComponent({
  content,
  placeholder,
  onChange,
  onKeyDown,
  preventEnterSubmit = false,
  growUpward = false,
  eventId: _eventId,
  members: _members = [],
  isMobile: _isMobile = false,
}: BlockNoteInlineProps, ref: React.ForwardedRef<BlockNoteInlineHandle>) {
  const [_editorContent, setEditorContent] = useState(content);
  const { resolvedTheme } = useTheme();

  // Track if initial content has been set
  const hasSetInitialContent = useRef(false);
  const isSettingInitialContent = useRef(false);

  // Create the editor instance using the hook
  const editor = useCreateBlockNote({
    initialContent: undefined,
    placeholders: {
      default: placeholder || 'Write something...',
    },
  });

  // Expose imperative methods to parent
  useImperativeHandle(ref, () => ({
    clear: () => {
      // Replace all blocks with a single empty paragraph
      const emptyBlock = { type: 'paragraph' as const, content: [] };
      editor.replaceBlocks(editor.document, [emptyBlock]);
      // Reset the initial content flag so new content can be set
      hasSetInitialContent.current = false;
      // Notify parent that content is now empty
      onChange('');
    },
    focus: () => {
      editor.focus();
    },
  }), [editor, onChange]);

  // Set initial content from HTML when editor is ready
  useEffect(() => {
    if (editor && content && !hasSetInitialContent.current) {
      const setInitialContent = async () => {
        try {
          isSettingInitialContent.current = true;
          const blocks = await editor.tryParseHTMLToBlocks(content);
          if (blocks && blocks.length > 0) {
            editor.replaceBlocks(editor.document, blocks);
            hasSetInitialContent.current = true;
          }
          setTimeout(() => {
            isSettingInitialContent.current = false;
          }, 50);
        } catch (error) {
          console.error('Failed to parse initial HTML content:', error);
          isSettingInitialContent.current = false;
        }
      };
      setInitialContent();
    }
  }, [editor, content]);

  // Handle content changes
  const handleChange = useCallback(async () => {
    // Skip onChange during initial content setup
    if (isSettingInitialContent.current) {
      return;
    }
    const rawHtml = await editor.blocksToHTMLLossy(editor.document);
    const html = stripEmptyParagraphs(rawHtml);
    setEditorContent(html);

    // Only call onChange if content is not empty
    if (!html || html.trim() === '') {
      onChange('');
    } else {
      onChange(html);
    }
  }, [editor, onChange]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Handle Enter key behavior
      if (event.key === 'Enter' && !event.shiftKey) {
        // If preventEnterSubmit is true (mobile), allow Enter to create newline
        if (preventEnterSubmit) {
          return; // Let BlockNote handle Enter normally
        }

        // Otherwise, prevent default and call onKeyDown for form submission
        event.preventDefault();
        onKeyDown?.(event);
        return;
      }

      // For other keys, call the parent handler
      onKeyDown?.(event);
    },
    [onKeyDown, preventEnterSubmit]
  );

  return (
    <div
      className={cn(
        'blocknote-inline',
        growUpward && 'flex flex-col justify-center'
      )}
      onKeyDownCapture={handleKeyDown}
    >
      <div
        className={cn(
          growUpward
            ? 'min-h-[44px] max-h-[200px] rounded-md bg-muted border border-border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 overflow-y-auto flex flex-col justify-center'
            : 'min-h-[44px] rounded-md bg-muted border border-border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
        )}
      >
        <BlockNoteView
          editor={editor}
          onChange={handleChange}
          theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
          sideMenu={false}
          formattingToolbar={false}
        />
      </div>
    </div>
  );
}

export const BlockNoteInline = forwardRef(BlockNoteInlineComponent);