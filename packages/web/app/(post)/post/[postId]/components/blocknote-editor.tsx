'use client';

import { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import {
  useCreateBlockNote,
  SuggestionMenuController,
  SuggestionMenuProps,
} from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/shadcn/style.css';

import { cn, getInitialsFromName } from '@/lib/utils';
import { Id, Doc } from '@/convex/_generated/dataModel';
import { User } from '@/convex/types';

// Strip leading and trailing empty paragraph tags that BlockNote adds
const stripEmptyParagraphs = (html: string): string => {
  return html
    .replace(/^(<p>(\s|&nbsp;)*<\/p>)+/gi, '') // Remove leading empty paragraphs
    .replace(/(<p>(\s|&nbsp;)*<\/p>)+$/gi, '') // Remove trailing empty paragraphs
    .trim();
};

// Custom mention item type for @ mentions
interface MentionItem {
  personId: Id<'persons'>;
  displayName: string;
  username: string;
  image?: string;
}

const DEFAULT_MAX_LENGTH = 2000;

type MemberWithPerson = Doc<"memberships"> & {
  person: Doc<"persons"> & {
    user: User;
  };
};

export function BlockNoteEditor({
  content,
  onChange,
  placeholder = "What's on your mind?",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  eventId: _eventId,
  className,
  maxLength = DEFAULT_MAX_LENGTH,
  onSubmit,
  disabled = false,
  onChangeCapture,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  resetKey: _resetKey,
  members = [],
  'data-test': dataTest,
}: {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  eventId: Id<"events">;
  className?: string;
  maxLength?: number;
  onSubmit?: () => void;
  disabled?: boolean;
  onChangeCapture?: (content: string) => void;
  resetKey?: string;
  members?: MemberWithPerson[];
  'data-test'?: string;
}) {
  const [isOverLimit, setIsOverLimit] = useState(false);
  const { resolvedTheme } = useTheme();

  // Track if initial content has been set
  const hasSetInitialContent = useRef(false);
  // Track if we're currently setting initial content (to skip onChange)
  const isSettingInitialContent = useRef(false);

  // Create the editor instance using the hook
  const editor = useCreateBlockNote({
    placeholders: {
      default: placeholder,
    },
  });

  // Set initial content from HTML when editor is ready and content is provided
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
          // Small delay to ensure onChange from replaceBlocks completes before we stop ignoring
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

  // Build mention items from members
  const mentionItems = useMemo((): MentionItem[] => {
    return members.map((member) => {
      const user = member.person.user;
      const displayName = user.name || user.email || 'Unknown';
      const username = user.username || '';
      const image = user.image || undefined;

      return {
        personId: member.person._id,
        displayName,
        username,
        image,
      };
    });
  }, [members]);

  // Get filtered mention suggestions based on query
  const getMentionMenuItems = useCallback(
    async (query: string): Promise<MentionItem[]> => {
      const lowerQuery = query.toLowerCase();
      return mentionItems
        .filter((item) =>
          item.displayName.toLowerCase().includes(lowerQuery) ||
          item.username.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 10); // Limit to 10 results
    },
    [mentionItems]
  );

  // Handle content changes
  const handleChange = useCallback(async () => {
    // Skip onChange during initial content setup to avoid false "edited" state
    if (isSettingInitialContent.current) {
      return;
    }

    // Use BlockNote's built-in HTML conversion for proper rendering
    const rawHtml = await editor.blocksToHTMLLossy(editor.document);
    const html = stripEmptyParagraphs(rawHtml);
    setIsOverLimit(html.length > maxLength);

    onChange(html);

    // Call onChangeCapture if provided (for edit tracking)
    if (onChangeCapture) {
      onChangeCapture(html);
    }
  }, [editor, onChange, onChangeCapture, maxLength]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Submit on Ctrl+Enter or Cmd+Enter
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        onSubmit?.();
      }
    },
    [onSubmit]
  );

  return (
    <div
      className={cn(
        'relative min-h-[120px] rounded-lg',
        disabled && 'cursor-not-allowed opacity-50',
        isOverLimit && 'bg-red-50/50 dark:bg-red-950/20',
        className
      )}
      data-test={dataTest}
      onKeyDown={handleKeyDown}
      // Prevent BlockNote toolbar buttons from submitting parent forms
      onClickCapture={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') && !target.closest('[type="submit"]')) {
          e.preventDefault();
        }
      }}
    >
      {/* BlockNote Editor */}
      <div className="rounded-lg">
        <BlockNoteView
          editor={editor}
          onChange={handleChange}
          editable={!disabled}
          theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
        >
        {/* Mention Menu - triggered by @ */}
        <SuggestionMenuController
          triggerCharacter="@"
          getItems={getMentionMenuItems}
          suggestionMenuComponent={({
            items,
            onItemClick,
            selectedIndex,
          }: SuggestionMenuProps<MentionItem>) => (
            <div className="bg-popover border border-border rounded-lg shadow-lg overflow-hidden min-w-[200px] max-w-[300px]">
              {items.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No members found
                </div>
              ) : (
                items.map((item, index) => (
                  <button
                    key={item.personId}
                    type="button"
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors',
                      index === selectedIndex && 'bg-accent'
                    )}
                    onClick={() => onItemClick?.(item)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={item.image} />
                      <AvatarFallback className="text-xs">
                        {getInitialsFromName(item.displayName, '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">
                        {item.displayName}
                      </span>
                      {item.username && (
                        <span className="text-xs text-muted-foreground truncate">
                          @{item.username}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
          onItemClick={(item: MentionItem) => {
            // Insert mention text at cursor
            editor.insertInlineContent([
              {
                type: 'text',
                text: `@${item.username || item.displayName}`,
                styles: { bold: true },
              },
              { type: 'text', text: ' ', styles: {} },
            ]);
          }}
        />
        </BlockNoteView>
      </div>

      {/* Character limit warning */}
      {isOverLimit && (
        <div className="px-3 pb-2 text-sm text-red-500">
          Content is too long
        </div>
      )}
    </div>
  );
}