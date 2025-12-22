'use client';

import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import ListKeymap from '@tiptap/extension-list-keymap';
import Gapcursor from '@tiptap/extension-gapcursor';
import Dropcursor from '@tiptap/extension-dropcursor';
import Typography from '@tiptap/extension-typography';
import FileHandler from '@tiptap/extension-file-handler';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
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

export function TiptapInline({
  content,
  placeholder,
  onChange,
  onKeyDown,
  preventEnterSubmit = false,
  growUpward = false,
  eventId,
  members = [],
  isMobile = false,
}: {
  content: string;
  placeholder: string;
  onChange: (richText: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  preventEnterSubmit?: boolean;
  growUpward?: boolean;
  eventId?: string;
  members?: Member[];
  isMobile?: boolean;
}) {
  // Store members in a ref so the mention extension can access current value
  const membersRef = useRef<Member[]>(members || []);
  useEffect(() => {
    membersRef.current = members || [];
  }, [members]);
  
  // Store isMobile in a ref so the mention extension can access current value
  const isMobileRef = useRef<boolean>(isMobile);
  useEffect(() => {
    isMobileRef.current = isMobile;
  }, [isMobile]);

  // Track if suggestion menu is open to prevent form submission
  const suggestionMenuOpenRef = useRef<boolean>(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
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
      Placeholder.configure({
        placeholder: placeholder,
      }),
      ListKeymap,
      Gapcursor,
      Dropcursor,
      Typography,
      FileHandler,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      // eslint-disable-next-line react-hooks/refs -- TipTap extension accepts refs; reads happen in event handlers, not render
      SlashCommandExtension.configure({
        suggestionMenuOpenRef: suggestionMenuOpenRef,
      }),
      ...(eventId
        ? [
            // eslint-disable-next-line react-hooks/refs -- TipTap extension accepts refs; reads happen in event handlers, not render
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
                items: ({ query }: { query: string }) => {
                  const currentMembers = membersRef.current;
                  if (!currentMembers || currentMembers.length === 0) {
                    return [];
                  }
                  const lowerQuery = query.toLowerCase();
                  return currentMembers
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
                },
                render: () => {
                  let component: ReactRenderer | null = null;
                  let container: HTMLDivElement | null = null;
                  let scrollHandler: (() => void) | null = null;
                  let resizeHandler: (() => void) | null = null;
                  let editorElementRef: HTMLElement | null = null;

                  return {
                    onStart: (props: SuggestionProps<Member>) => {
                      suggestionMenuOpenRef.current = true;
                      editorElementRef = props.editor.view.dom as HTMLElement;
                      const mobileMode = isMobileRef.current;
                      component = new ReactRenderer(MentionList, {
                        props: {
                          items: props.items,
                          command: props.command,
                          isMobile: mobileMode,
                        },
                        editor: props.editor,
                      });

                      container = document.createElement('div');
                      
                      const editorElement = props.editor.view.dom as HTMLElement;
                      const editorParent = editorElement.parentElement;
                      
                      if (mobileMode && editorParent) {
                        // On mobile: use absolute positioning relative to parent
                        // Use z-0 so it doesn't cover the input focus ring
                        container.style.zIndex = '0';
                        container.style.position = 'absolute';
                        editorParent.style.position = 'relative';
                        editorParent.appendChild(container);
                      } else {
                        // On desktop: use fixed positioning relative to viewport
                        container.style.zIndex = '9999';
                        container.style.position = 'fixed';
                        document.body.appendChild(container);
                      }
                      
                      // ReactRenderer.element is the root DOM element
                      container.appendChild(component.element);

                      const updatePosition = () => {
                        if (!props.clientRect || !container) return;
                        const editorWidth = editorElement.offsetWidth;
                        
                        const mobileMode = isMobileRef.current;
                        if (mobileMode && editorParent) {
                          // Mobile: position relative to parent
                          const parentRect = editorParent.getBoundingClientRect();
                          const editorRect = editorElement.getBoundingClientRect();
                          
                          container.style.left = `${editorRect.left - parentRect.left}px`;
                          container.style.width = `${editorWidth}px`;
                          container.style.top = `${editorRect.top - parentRect.top}px`;
                          container.style.transform = 'translateY(-100%)';
                          
                          // Remove top border radius from input when menu is open
                          if (editorElementRef) {
                            editorElementRef.classList.add('mention-menu-open');
                          }
                        } else {
                          // Desktop: position relative to viewport
                          const editorRect = editorElement.getBoundingClientRect();
                          
                          container.style.left = `${editorRect.left}px`;
                          container.style.width = `${editorWidth}px`;
                          container.style.top = `${editorRect.top + window.scrollY}px`;
                          container.style.transform = 'translateY(-100%)';
                        }
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
                        const editorElement = props.editor.view.dom as HTMLElement;
                        const editorParent = editorElement.parentElement;
                        const editorWidth = editorElement.offsetWidth;
                        const mobileMode = isMobileRef.current;
                        
                        if (mobileMode && editorParent) {
                          // Mobile: position relative to parent
                          const parentRect = editorParent.getBoundingClientRect();
                          const editorRect = editorElement.getBoundingClientRect();
                          
                          container.style.left = `${editorRect.left - parentRect.left}px`;
                          container.style.width = `${editorWidth}px`;
                          container.style.top = `${editorRect.top - parentRect.top}px`;
                          container.style.transform = 'translateY(-100%)';
                          
                          // Remove top border radius from input when menu is open
                          if (editorElementRef) {
                            editorElementRef.classList.add('mention-menu-open');
                          }
                        } else {
                          // Desktop: position relative to viewport
                          const editorRect = editorElement.getBoundingClientRect();
                          
                          container.style.left = `${editorRect.left}px`;
                          container.style.width = `${editorWidth}px`;
                          container.style.top = `${editorRect.top + window.scrollY}px`;
                          container.style.transform = 'translateY(-100%)';
                        }
                      }
                    },
                    onKeyDown(props: SuggestionKeyDownProps) {
                      if (props.event.key === 'Escape') {
                        suggestionMenuOpenRef.current = false;
                        const mobileMode = isMobileRef.current;
                        if (mobileMode && editorElementRef) {
                          editorElementRef.classList.remove('mention-menu-open');
                        }
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
                        editorElementRef = null;
                        return true;
                      }
                      // Handle Enter and Tab when menu is open - prevent form submission
                      if ((props.event.key === 'Enter' || props.event.key === 'Tab') && component?.ref) {
                        const ref = component.ref as { onKeyDown?: (props: { event: KeyboardEvent }) => boolean };
                        const handled = ref.onKeyDown?.({ event: props.event });
                        if (handled) {
                          props.event.preventDefault();
                          props.event.stopPropagation();
                          suggestionMenuOpenRef.current = false;
                          return true; // Prevent default behavior (form submission)
                        }
                      }
                      // Always try to handle keyboard navigation even if not Enter/Tab
                      if (component?.ref) {
                        const ref = component.ref as { onKeyDown?: (props: { event: KeyboardEvent }) => boolean };
                        return ref.onKeyDown?.({ event: props.event }) ?? false;
                      }
                      return false;
                    },
                    onExit() {
                      suggestionMenuOpenRef.current = false;
                      const mobileMode = isMobileRef.current;
                      if (mobileMode && editorElementRef) {
                        editorElementRef.classList.remove('mention-menu-open');
                      }
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
                      editorElementRef = null;
                    },
                  };
                },
              },
            }),
          ]
        : []),
    ],
    content: content,
    editorProps: {
      attributes: {
        class: growUpward
          ? 'min-h-[48px] max-h-[200px] rounded-md bg-muted border border-border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 overflow-y-auto flex flex-col justify-center'
          : 'min-h-[48px] rounded-md bg-muted border border-border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      },
      handleKeyDown: (view, event) => {
        // If suggestion menu is open, don't process Enter/Tab here - let suggestion plugin handle it
        // The suggestion plugin runs before this handler, so if it handled the key, this won't be called
        // But we check the ref here as a safety net to prevent form submission
        if (suggestionMenuOpenRef.current && (event.key === 'Enter' || event.key === 'Tab')) {
          return false; // Let suggestion plugin handle it
        }

        if (onKeyDown) {
          // Check for Enter key without Shift first
          if (event.key === 'Enter' && !event.shiftKey) {
            // Check if we're inside a list (bulletList or orderedList)
            const { state } = view;
            const { $from } = state.selection;

            // Check if the current node or any parent node is a list
            let isInList = false;
            for (let depth = $from.depth; depth > 0; depth--) {
              const node = $from.node(depth);
              if (
                node.type.name === 'bulletList' ||
                node.type.name === 'orderedList'
              ) {
                isInList = true;
                break;
              }
            }

            // If we're in a list, let Tiptap handle Enter normally (creates new list item)
            if (isInList) {
              return false; // Let Tiptap handle it
            }

            // If preventEnterSubmit is true (mobile), let Enter create newline
            if (preventEnterSubmit) {
              return false; // Let Tiptap handle Enter normally (creates newline)
            }

            // If we're not in a list and not preventing submit, prevent default and submit form
            event.preventDefault();

            // Create a synthetic event that matches React's KeyboardEvent
            const syntheticEvent = {
              ...event,
              preventDefault: () => {
                // Already prevented, but allow handler to call it
                event.preventDefault();
              },
              stopPropagation: () => event.stopPropagation(),
              key: event.key,
              shiftKey: event.shiftKey,
              ctrlKey: event.ctrlKey,
              metaKey: event.metaKey,
              altKey: event.altKey,
            } as unknown as React.KeyboardEvent;

            // Call the parent handler
            onKeyDown(syntheticEvent);

            // Prevent Tiptap from handling Enter without Shift when not in list
            return true;
          }

          // For other keys, create synthetic event and call handler
          let preventDefaultCalled = false;
          const syntheticEvent = {
            ...event,
            preventDefault: () => {
              preventDefaultCalled = true;
              event.preventDefault();
            },
            stopPropagation: () => event.stopPropagation(),
            key: event.key,
            shiftKey: event.shiftKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            altKey: event.altKey,
          } as unknown as React.KeyboardEvent;

          onKeyDown(syntheticEvent);

          // If preventDefault was called, stop Tiptap from handling it
          return preventDefaultCalled;
        }
        return false; // Let Tiptap handle the key normally if not handled
      },
    },
    onUpdate({ editor }) {
      if (!isActuallyEmpty(editor.getHTML())) {
        onChange(editor.getHTML());
      } else {
        onChange('');
      }
    },
  });

  // Update editor content when content prop changes (e.g., when form resets)
  useEffect(() => {
    if (!editor) return;

    const currentContent = editor.getHTML();
    const normalizedCurrent = isActuallyEmpty(currentContent)
      ? ''
      : currentContent;
    const normalizedNew = isActuallyEmpty(content) ? '' : content || '';

    // Only update if content actually changed
    if (normalizedCurrent !== normalizedNew) {
      editor.commands.setContent(normalizedNew);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <EditorContent
      editor={editor}
      className={cn(
        'tiptap-inline',
        growUpward &&
          '[&_.ProseMirror]:flex [&_.ProseMirror]:flex-col [&_.ProseMirror]:justify-center'
      )}
    />
  );
}
