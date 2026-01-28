'use client';

import { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import {
  useCreateBlockNote,
  SuggestionMenuController,
  SuggestionMenuProps,
  createReactInlineContentSpec,
  getDefaultReactSlashMenuItems,
  DefaultReactSuggestionItem,
  FormattingToolbarController,
  BasicTextStyleButton,
  TextAlignButton,
  ColorStyleButton,
  NestBlockButton,
  UnnestBlockButton,
  CreateLinkButton,
  useBlockNoteEditor,
  useSelectedBlocks,
  useComponentsContext,
} from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import { FormattingToolbar } from '@blocknote/react';
import { BlockNoteSchema, defaultInlineContentSpecs } from '@blocknote/core';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/shadcn/style.css';

import { cn, getInitialsFromName } from '@/lib/utils';
import { Id, Doc } from '@/convex/_generated/dataModel';
import { User } from '@/convex/types';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import {
  Pilcrow,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  TextQuote,
} from 'lucide-react';

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

// Media block types to exclude from slash menu (handled separately as attachments)
const EXCLUDED_SLASH_ITEMS = ['Image', 'Video', 'Audio', 'File'];

// Filter function for slash menu items
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

// Custom mention item type for @ mentions
interface MentionItem {
  personId: Id<'persons'>;
  displayName: string;
  username: string;
  image?: string;
}

// Block type options for the custom block type selector
interface BlockTypeOption {
  type: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  props?: { level?: number };
}

const BLOCK_TYPE_OPTIONS: BlockTypeOption[] = [
  { type: 'paragraph', label: 'Paragraph', icon: Pilcrow },
  { type: 'heading', label: 'Heading 1', icon: Heading1, props: { level: 1 } },
  { type: 'heading', label: 'Heading 2', icon: Heading2, props: { level: 2 } },
  { type: 'heading', label: 'Heading 3', icon: Heading3, props: { level: 3 } },
  { type: 'bulletListItem', label: 'Bullet List', icon: List },
  { type: 'numberedListItem', label: 'Numbered List', icon: ListOrdered },
  { type: 'checkListItem', label: 'Check List', icon: ListChecks },
  { type: 'quote', label: 'Quote', icon: TextQuote },
];

/**
 * Custom touch-friendly block type selector
 * Replaces the default BlockTypeSelect dropdown which has touch issues on mobile
 */
function TouchBlockTypeSelect() {
  const editor = useBlockNoteEditor();
  const Components = useComponentsContext();
  const selectedBlocks = useSelectedBlocks();
  const [open, setOpen] = useState(false);

  // Get current block type
  const currentBlock = selectedBlocks[0];
  const currentType = currentBlock?.type || 'paragraph';
  const currentLevel =
    currentBlock?.type === 'heading'
      ? (currentBlock.props as { level?: number })?.level
      : undefined;

  // Find current label
  const currentOption = BLOCK_TYPE_OPTIONS.find(opt => {
    if (opt.type !== currentType) return false;
    if (opt.type === 'heading' && opt.props?.level !== currentLevel)
      return false;
    return true;
  });
  const currentLabel = currentOption?.label || 'Paragraph';

  const handleSelect = (type: string, props?: { level?: number }) => {
    setOpen(false);
    editor.focus();

    // Update all selected blocks
    for (const block of selectedBlocks) {
      editor.updateBlock(block, {
        type: type as 'paragraph',
        props: props as Record<string, unknown>,
      });
    }
  };

  if (!Components) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          className='h-7 px-2 text-xs gap-1'
          onMouseDown={e => {
            e.preventDefault();
            setOpen(!open);
          }}
        >
          {currentLabel}
          <Icons.down size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-44 p-1'
        align='start'
        onOpenAutoFocus={e => e.preventDefault()}
      >
        {BLOCK_TYPE_OPTIONS.map(option => (
          <button
            key={option.label}
            type='button'
            className={cn(
              'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded',
              'hover:bg-accent active:bg-accent transition-colors text-left',
              currentLabel === option.label && 'bg-accent'
            )}
            onMouseDown={e => {
              e.preventDefault();
              handleSelect(option.type, option.props);
            }}
          >
            <option.icon size={16} className='shrink-0' />
            {option.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

const DEFAULT_MAX_LENGTH = 2000;

type MemberWithPerson = Doc<'memberships'> & {
  person: Doc<'persons'> & {
    user: User;
  };
};

export function BlockNoteEditor({
  content,
  onChange,
  placeholder = "What's on your mind?",
  className,
  maxLength = DEFAULT_MAX_LENGTH,
  onSubmit,
  disabled = false,
  onChangeCapture,
  members = [],
  'data-test': dataTest,
}: {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  eventId: Id<'events'>;
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

  // Create the editor instance using the hook with custom schema
  const editor = useCreateBlockNote({
    schema,
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
      onClickCapture={e => {
        const target = e.target as HTMLElement;
        if (target.closest('button') && !target.closest('[type="submit"]')) {
          e.preventDefault();
        }
      }}
    >
      {/* BlockNote Editor */}
      <div className='rounded-lg'>
        <BlockNoteView
          editor={editor}
          onChange={handleChange}
          editable={!disabled}
          theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
          slashMenu={false}
          formattingToolbar={false}
        >
          {/* Custom Formatting Toolbar with touch-friendly block type selector */}
          <FormattingToolbarController
            formattingToolbar={() => (
              <FormattingToolbar>
                <TouchBlockTypeSelect key='blockTypeSelect' />

                <BasicTextStyleButton
                  basicTextStyle='bold'
                  key='boldStyleButton'
                />
                <BasicTextStyleButton
                  basicTextStyle='italic'
                  key='italicStyleButton'
                />
                <BasicTextStyleButton
                  basicTextStyle='underline'
                  key='underlineStyleButton'
                />
                <BasicTextStyleButton
                  basicTextStyle='strike'
                  key='strikeStyleButton'
                />
                <BasicTextStyleButton
                  basicTextStyle='code'
                  key='codeStyleButton'
                />

                <TextAlignButton textAlignment='left' key='textAlignLeft' />
                <TextAlignButton textAlignment='center' key='textAlignCenter' />
                <TextAlignButton textAlignment='right' key='textAlignRight' />

                <ColorStyleButton key='colorStyleButton' />
                <NestBlockButton key='nestBlockButton' />
                <UnnestBlockButton key='unnestBlockButton' />
                <CreateLinkButton key='createLinkButton' />
              </FormattingToolbar>
            )}
          />

          {/* Mention Menu - triggered by @ */}
          <SuggestionMenuController
            triggerCharacter='@'
            getItems={getMentionMenuItems}
            suggestionMenuComponent={({
              items,
              onItemClick,
              selectedIndex,
            }: SuggestionMenuProps<MentionItem>) => (
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
                        'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent active:bg-accent transition-colors',
                        index === selectedIndex && 'bg-accent'
                      )}
                      // Use onMouseDown instead of onClick for better mobile touch support
                      onMouseDown={e => {
                        e.preventDefault();
                        onItemClick?.(item);
                      }}
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
          {/* Slash Menu - triggered by / (excluding media blocks) */}
          <SuggestionMenuController
            triggerCharacter='/'
            getItems={async query =>
              filterSlashMenuItems(getDefaultReactSlashMenuItems(editor), query)
            }
            suggestionMenuComponent={({
              items,
              onItemClick,
              selectedIndex,
            }: SuggestionMenuProps<DefaultReactSuggestionItem>) => (
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
                        'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent active:bg-accent transition-colors',
                        index === selectedIndex && 'bg-accent'
                      )}
                      // Use onMouseDown instead of onClick for better mobile touch support
                      onMouseDown={e => {
                        e.preventDefault();
                        onItemClick?.(item);
                      }}
                    >
                      {item.icon && (
                        <span className='text-lg'>{item.icon}</span>
                      )}
                      <div className='flex flex-col min-w-0'>
                        <span className='text-sm font-medium truncate'>
                          {item.title}
                        </span>
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
            )}
          />
        </BlockNoteView>
      </div>

      {/* Character limit warning */}
      {isOverLimit && (
        <div className='px-3 pb-2 text-sm text-red-500'>
          Content is too long
        </div>
      )}
    </div>
  );
}
