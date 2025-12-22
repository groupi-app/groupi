'use client';

import Heading from '@tiptap/extension-heading';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import ListKeymap from '@tiptap/extension-list-keymap';
import Gapcursor from '@tiptap/extension-gapcursor';
import Dropcursor from '@tiptap/extension-dropcursor';
import Typography from '@tiptap/extension-typography';
import FileHandler from '@tiptap/extension-file-handler';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { Toolbar } from './toolbar';
import { BubbleMenu } from './bubble-menu';
import { useEffect, useRef, useMemo } from 'react';
import Mention from '@tiptap/extension-mention';
import { ReactRenderer } from '@tiptap/react';
import { MentionList } from './mention-list';
import { SlashCommandExtension } from './slash-command-extension';
import type { PostDetailPageData } from '@groupi/schema/data';
import type { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';

type Member = PostDetailPageData['post']['event']['memberships'][0];

const isActuallyEmpty = (html: string) => {
  const emptyElementPattern = /^<(\w+)(\s[^>]*)?>\s*<\/\1>$/;
  const nonAlphanumericPattern = /^[^0-9a-zA-Z]+$/;
  const trimmedHtml = html.trim();

  // Check if the HTML string is an empty tag or contains only non-alphanumeric characters
  return (
    emptyElementPattern.test(trimmedHtml) ||
    nonAlphanumericPattern.test(trimmedHtml)
  );
};

/**
 * TipTap rich text editor component with transient state support.
 *
 * This component syncs content on mount and when resetKey changes,
 * ensuring the editor always reflects the current prop value.
 *
 * @param content - The HTML content to display/edit
 * @param placeholder - Placeholder text when empty
 * @param onChange - Called when content changes
 * @param onChangeCapture - Called during content changes (for edit tracking)
 * @param resetKey - Increment to force content sync (used by transient forms)
 *
 * @see docs/STATE_ARCHITECTURE.md for the full state management guide
 */
export function Tiptap({
  content,
  placeholder,
  onChange,
  onChangeCapture,
  resetKey = 0,
  eventId,
  members = [],
}: {
  content: string;
  placeholder: string;
  onChange: (richText: string) => void;
  onChangeCapture: (richText: string) => void;
  resetKey?: number;
  eventId?: string;
  members?: Member[];
}) {
  // Store members in a ref so the mention extension can access current value
  const membersRef = useRef<Member[]>(members || []);
  useEffect(() => {
    membersRef.current = members || [];
  }, [members]);

  useEffect(() => {
    console.log('[Tiptap] Props changed', { eventId, membersCount: members.length });
  }, [eventId, members.length]);

  // Memoize extensions to ensure mention extension is included when eventId exists
  const extensions = useMemo(() => {
    const baseExtensions = [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: { class: 'list-disc list-outside ml-8' },
        },
        orderedList: {
          HTMLAttributes: { class: 'list-decimal list-outside ml-8' },
        },
        code: {
          HTMLAttributes: {
            class: 'text-sm rounded-md bg-muted/50 border border-border/50 py-1 px-1.5 mx-1',
          },
        },
      }),
      Heading.configure({
        HTMLAttributes: { class: 'text-2xl font-heading', levels: [2] },
      }),
      Underline,
      Placeholder.configure({
        placeholder: placeholder,
      }),
      CharacterCount.configure({
        limit: 5000,
      }),
      ListKeymap,
      Gapcursor,
      Dropcursor,
      Typography,
      FileHandler,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      SlashCommandExtension,
      ...(eventId
        ? (() => {
            console.log('[Tiptap] Adding mention extension', { eventId, membersCount: members.length });
            return [
              Mention.configure({
              HTMLAttributes: {
                class: 'mention',
              },
              renderHTML({ node }) {
                return [
                  'span',
                  {
                    class: 'mention',
                    'data-id': node.attrs.id,
                    'data-type': 'mention',
                  },
                  `@${node.attrs.label ?? node.attrs.id}`,
                ];
              },
              suggestion: {
                char: '@',
                allowSpaces: false,
                items: ({ query }: { query: string }) => {
                  // Use members from closure instead of ref to avoid accessing ref during render
                  const currentMembers = members;
                  console.log('[Mention] items called', { query, membersCount: currentMembers?.length, eventId });
                  if (!currentMembers || currentMembers.length === 0) {
                    console.log('[Mention] No members available');
                    return [];
                  }
                  const lowerQuery = query.toLowerCase();
                  const filtered = currentMembers
                    .filter(member => {
                      const user = member.person.user;
                      const displayName =
                        (user?.name || user?.email || '').toLowerCase();
                      const username = (user?.username || '').toLowerCase();
                      return (
                        displayName.includes(lowerQuery) ||
                        username.includes(lowerQuery)
                      );
                    })
                    .slice(0, 5);
                  console.log('[Mention] Filtered results', filtered.length);
                  return filtered;
                },
                render: () => {
                  let component: ReactRenderer | null = null;
                  let container: HTMLDivElement | null = null;
                  let scrollHandler: (() => void) | null = null;
                  let resizeHandler: (() => void) | null = null;

                  return {
                    onStart: (props: SuggestionProps<Member>) => {
                      console.log('[Mention] onStart called', props);
                      component = new ReactRenderer(MentionList, {
                        props: {
                          items: props.items,
                          command: props.command,
                        },
                        editor: props.editor,
                      });

                      container = document.createElement('div');
                      container.style.position = 'fixed';
                      container.style.zIndex = '9999';
                      document.body.appendChild(container);
                      
                      // ReactRenderer.element is the root DOM element
                      container.appendChild(component.element);

                      const updatePosition = () => {
                        if (!props.clientRect || !container) return;
                        const rect = props.clientRect();
                        if (!rect) return;
                        container.style.left = `${rect.left}px`;
                        container.style.top = `${rect.bottom + window.scrollY + 4}px`;
                      };

                      updatePosition();

                      scrollHandler = () => updatePosition();
                      resizeHandler = () => updatePosition();
                      window.addEventListener('scroll', scrollHandler, true);
                      window.addEventListener('resize', resizeHandler);
                    },
                    onUpdate(props: SuggestionProps<Member>) {
                      component?.updateProps({
                        items: props.items,
                        command: props.command,
                      });

                      if (props.clientRect && container) {
                        const rect = props.clientRect();
                        if (!rect) return;
                        container.style.left = `${rect.left}px`;
                        container.style.top = `${rect.bottom + window.scrollY + 4}px`;
                      }
                    },
                    onKeyDown(props: SuggestionKeyDownProps) {
                      if (props.event.key === 'Escape') {
                        if (scrollHandler) {
                          window.removeEventListener('scroll', scrollHandler, true);
                        }
                        if (resizeHandler) {
                          window.removeEventListener('resize', resizeHandler);
                        }
                        if (container && container.parentNode) {
                          container.parentNode.removeChild(container);
                        }
                        component?.destroy();
                        component = null;
                        container = null;
                        scrollHandler = null;
                        resizeHandler = null;
                        return true;
                      }
                      // Handle Enter and Tab when menu is open - prevent form submission
                      if ((props.event.key === 'Enter' || props.event.key === 'Tab') && component?.ref) {
                        const ref = component.ref as { onKeyDown?: (props: { event: KeyboardEvent }) => boolean };
                        const handled = ref.onKeyDown?.({ event: props.event });
                        if (handled) {
                          return true; // Prevent default behavior (form submission)
                        }
                      }
                      if (component?.ref) {
                        const ref = component.ref as { onKeyDown?: (props: { event: KeyboardEvent }) => boolean };
                        return ref.onKeyDown?.({ event: props.event }) ?? false;
                      }
                      return false;
                    },
                    onExit() {
                      if (scrollHandler) {
                        window.removeEventListener('scroll', scrollHandler, true);
                      }
                      if (resizeHandler) {
                        window.removeEventListener('resize', resizeHandler);
                      }
                      if (container && container.parentNode) {
                        container.parentNode.removeChild(container);
                      }
                      component?.destroy();
                      component = null;
                      container = null;
                      scrollHandler = null;
                      resizeHandler = null;
                    },
                  };
                },
              },
            }),
          ];
          })()
        : []),
    ];
    return baseExtensions;
  }, [eventId, placeholder, members]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: content,
    editorProps: {
      attributes: {
        class:
          'min-h-[150px] rounded-md bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      },
    },
    onUpdate({ editor }) {
      if (!isActuallyEmpty(editor.getHTML())) {
        onChange(editor.getHTML());
        onChangeCapture(editor.getHTML());
      } else {
        onChange('');
        onChangeCapture('');
      }
    },
  });

  // Track whether we've completed initial content sync
  const hasInitializedRef = useRef(false);
  // Track the last resetKey to detect forced resets
  const lastResetKeyRef = useRef(resetKey);

  // Debug: Check if mention extension is loaded
  useEffect(() => {
    if (editor) {
      const hasMention = editor.extensionManager.extensions.some(
        ext => ext.name === 'mention'
      );
      console.log('[Tiptap] Editor extensions check', {
        hasMention,
        eventId,
        membersCount: membersRef.current.length,
        extensionNames: editor.extensionManager.extensions.map(e => e.name),
      });
    }
  }, [editor, eventId]);

  // Sync editor content with the content prop
  // Uses hasInitialized pattern to force sync on mount
  // Also syncs when resetKey changes (form was reset)
  useEffect(() => {
    if (!editor) return;

    // Force sync on first render after editor is ready
    // This ensures the editor matches the prop even if content is empty
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      editor.commands.setContent(content);
      lastResetKeyRef.current = resetKey;
      return;
    }

    // Force sync when resetKey changes (parent form was reset)
    if (lastResetKeyRef.current !== resetKey) {
      editor.commands.setContent(content);
      lastResetKeyRef.current = resetKey;
      return;
    }

    // Normal sync for subsequent content prop changes
    // Only update if content actually differs to prevent loops
    const currentEditorContent = editor.getHTML();
    if (currentEditorContent !== content) {
      editor.commands.setContent(content);
    }
  }, [content, editor, resetKey]);

  if (!editor) {
    return null;
  }
  return (
    <div className='flex flex-col justify-stretch gap-3'>
      <Toolbar editor={editor} />
      {editor && (
        <BubbleMenu
          editor={editor}
          className='flex gap-1 rounded-md border bg-background p-1 shadow-md'
        >
          <button
            type='button'
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-2 py-1 rounded ${
              editor.isActive('bold') ? 'bg-muted' : ''
            }`}
          >
            Bold
          </button>
          <button
            type='button'
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-2 py-1 rounded ${
              editor.isActive('italic') ? 'bg-muted' : ''
            }`}
          >
            Italic
          </button>
          <button
            type='button'
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`px-2 py-1 rounded ${
              editor.isActive('strike') ? 'bg-muted' : ''
            }`}
          >
            Strike
          </button>
        </BubbleMenu>
      )}
      <EditorContent data-test='tiptap-editor' editor={editor} />
      {editor && (
        <div className='text-xs text-muted-foreground text-right'>
          {editor.storage.characterCount.characters()} / 5000
        </div>
      )}
    </div>
  );
}
