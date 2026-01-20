'use client';

import React, {
  useCallback,
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useMemo,
} from 'react';
import {
  useCreateBlockNote,
  SuggestionMenuController,
  SuggestionMenuProps,
  createReactInlineContentSpec,
  getDefaultReactSlashMenuItems,
  DefaultReactSuggestionItem,
} from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import { BlockNoteSchema, defaultInlineContentSpecs } from '@blocknote/core';
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

// Custom mention inline content spec
const Mention = createReactInlineContentSpec(
  {
    type: 'mention',
    propSchema: {
      personId: { default: '' },
      label: { default: '' },
    },
    content: 'none',
  },
  {
    render: props => (
      <span className='mention' data-id={props.inlineContent.props.personId}>
        @{props.inlineContent.props.label}
      </span>
    ),
  }
);

// Create schema with custom mention inline content
const schema = BlockNoteSchema.create({
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    mention: Mention,
  },
});

// Custom mention item type for @ mentions
interface MentionItem {
  personId: Id<'persons'>;
  displayName: string;
  username: string;
  image?: string;
}

type MemberWithPerson = Doc<'memberships'> & {
  person: Doc<'persons'> & {
    user: User;
  };
};

// Suggestion menu component that tracks visibility
function MentionSuggestionMenu({
  items,
  onItemClick,
  selectedIndex,
  onVisibilityChange,
}: SuggestionMenuProps<MentionItem> & {
  onVisibilityChange: (visible: boolean) => void;
}) {
  useEffect(() => {
    onVisibilityChange(true);
    return () => onVisibilityChange(false);
  }, [onVisibilityChange]);

  return (
    <div className='bg-popover border border-border rounded-lg shadow-lg overflow-hidden min-w-[200px] max-w-[300px]'>
      {items.length === 0 ? (
        <div className='px-3 py-2 text-sm text-muted-foreground'>
          No members found
        </div>
      ) : (
        items.map((item, index) => (
          <button
            key={item.personId}
            type='button'
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors',
              index === selectedIndex && 'bg-accent'
            )}
            onClick={() => onItemClick?.(item)}
          >
            <Avatar className='h-8 w-8'>
              <AvatarImage src={item.image} />
              <AvatarFallback className='text-xs'>
                {getInitialsFromName(item.displayName, '')}
              </AvatarFallback>
            </Avatar>
            <div className='flex flex-col min-w-0'>
              <span className='text-sm font-medium truncate'>
                {item.displayName}
              </span>
              {item.username && (
                <span className='text-xs text-muted-foreground truncate'>
                  @{item.username}
                </span>
              )}
            </div>
          </button>
        ))
      )}
    </div>
  );
}

// Slash menu component that tracks visibility
function SlashSuggestionMenu({
  items,
  onItemClick,
  selectedIndex,
  onVisibilityChange,
}: SuggestionMenuProps<DefaultReactSuggestionItem> & {
  onVisibilityChange: (visible: boolean) => void;
}) {
  useEffect(() => {
    onVisibilityChange(true);
    return () => onVisibilityChange(false);
  }, [onVisibilityChange]);

  return (
    <div className='bg-popover border border-border rounded-lg shadow-lg overflow-hidden min-w-[200px] max-w-[300px] max-h-[300px] overflow-y-auto'>
      {items.length === 0 ? (
        <div className='px-3 py-2 text-sm text-muted-foreground'>
          No commands found
        </div>
      ) : (
        items.map((item, index) => (
          <button
            key={item.title}
            type='button'
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors',
              index === selectedIndex && 'bg-accent'
            )}
            onClick={() => onItemClick?.(item)}
          >
            {item.icon && <span className='text-lg'>{item.icon}</span>}
            <div className='flex flex-col min-w-0'>
              <span className='text-sm font-medium truncate'>{item.title}</span>
              {item.subtext && (
                <span className='text-xs text-muted-foreground truncate'>
                  {item.subtext}
                </span>
              )}
            </div>
          </button>
        ))
      )}
    </div>
  );
}

// Media block types to exclude from slash menu (handled separately as attachments)
const EXCLUDED_SLASH_ITEMS = ['Image', 'Video', 'Audio', 'File'];

// Simple filter function for slash menu items
function filterSlashMenuItems(
  items: DefaultReactSuggestionItem[],
  query: string
): DefaultReactSuggestionItem[] {
  const lowerQuery = query.toLowerCase();
  return items
    .filter(item => !EXCLUDED_SLASH_ITEMS.includes(item.title))
    .filter(
      item =>
        item.title.toLowerCase().includes(lowerQuery) ||
        (item.subtext && item.subtext.toLowerCase().includes(lowerQuery)) ||
        (item.aliases &&
          item.aliases.some(alias => alias.toLowerCase().includes(lowerQuery)))
    );
}

interface BlockNoteInlineProps {
  content: string;
  placeholder: string;
  onChange: (richText: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  preventEnterSubmit?: boolean;
  growUpward?: boolean;
  eventId?: Id<'events'>;
  members?: MemberWithPerson[];
  isMobile?: boolean;
}

export interface BlockNoteInlineHandle {
  clear: () => void;
  focus: () => void;
}

function BlockNoteInlineComponent(
  {
    content,
    placeholder,
    onChange,
    onKeyDown,
    preventEnterSubmit = false,
    growUpward = false,
    members = [],
  }: BlockNoteInlineProps,
  ref: React.ForwardedRef<BlockNoteInlineHandle>
) {
  const [, setEditorContent] = useState(content);
  const { resolvedTheme } = useTheme();

  // Track if suggestion menu is open (to prevent Enter/Tab from submitting)
  const suggestionMenuOpenRef = useRef(false);

  // Callback to update suggestion menu visibility
  const handleSuggestionMenuVisibility = useCallback((visible: boolean) => {
    suggestionMenuOpenRef.current = visible;
  }, []);

  // Track if initial content has been set
  const hasSetInitialContent = useRef(false);
  const isSettingInitialContent = useRef(false);

  // Create the editor instance using the hook with custom schema
  const editor = useCreateBlockNote({
    schema,
    initialContent: undefined,
    placeholders: {
      default: placeholder || 'Write something...',
    },
  });

  // Build mention items from members
  const mentionItems = useMemo((): MentionItem[] => {
    return members.map(member => {
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
        .filter(
          item =>
            item.displayName.toLowerCase().includes(lowerQuery) ||
            item.username.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 10); // Limit to 10 results
    },
    [mentionItems]
  );

  // Expose imperative methods to parent
  useImperativeHandle(
    ref,
    () => ({
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
    }),
    [editor, onChange]
  );

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
      // If suggestion menu is open, let BlockNote handle Enter and Tab for item selection
      if (
        suggestionMenuOpenRef.current &&
        (event.key === 'Enter' || event.key === 'Tab')
      ) {
        return; // Let BlockNote handle these keys for the suggestion menu
      }

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
          slashMenu={false}
        >
          {/* Mention Menu - triggered by @ */}
          <SuggestionMenuController
            triggerCharacter='@'
            getItems={getMentionMenuItems}
            suggestionMenuComponent={(
              props: SuggestionMenuProps<MentionItem>
            ) => (
              <MentionSuggestionMenu
                {...props}
                onVisibilityChange={handleSuggestionMenuVisibility}
              />
            )}
            onItemClick={(item: MentionItem) => {
              // Insert custom mention inline content with personId and label
              editor.insertInlineContent([
                {
                  type: 'mention',
                  props: {
                    personId: item.personId,
                    label: item.username || item.displayName,
                  },
                },
                { type: 'text', text: ' ', styles: {} },
              ]);
            }}
          />
          {/* Slash Menu - triggered by / */}
          <SuggestionMenuController
            triggerCharacter='/'
            getItems={async query =>
              filterSlashMenuItems(getDefaultReactSlashMenuItems(editor), query)
            }
            suggestionMenuComponent={(
              props: SuggestionMenuProps<DefaultReactSuggestionItem>
            ) => (
              <SlashSuggestionMenu
                {...props}
                onVisibilityChange={handleSuggestionMenuVisibility}
              />
            )}
          />
        </BlockNoteView>
      </div>
    </div>
  );
}

export const BlockNoteInline = forwardRef(BlockNoteInlineComponent);
