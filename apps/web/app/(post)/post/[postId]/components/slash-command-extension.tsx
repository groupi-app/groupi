import { Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import { Suggestion } from '@tiptap/suggestion';
import { SlashCommandList, type SlashCommand } from './slash-command-list';
import { getSlashCommands } from './slash-commands';
import type React from 'react';
import type { Editor } from '@tiptap/react';
import type { Range } from '@tiptap/core';
import type {
  SuggestionProps,
  SuggestionKeyDownProps,
} from '@tiptap/suggestion';

export const SlashCommandExtension = Extension.create<{
  suggestionMenuOpenRef?: React.MutableRefObject<boolean>;
  suggestion?: {
    char: string;
    allowSpaces: boolean;
    allowedPrefixes: string[];
    command: (params: {
      editor: Editor;
      range: Range;
      props: SlashCommand;
    }) => void;
    render: () => Record<string, never>;
  };
}>({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestionMenuOpenRef: undefined,
      suggestion: {
        char: '/',
        allowSpaces: false,
        allowedPrefixes: [' ', '\n'],
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: Range;
          props: SlashCommand;
        }) => {
          if (!editor) {
            return;
          }
          // Delete the slash and query text
          editor.chain().focus().deleteRange(range).run();

          // Execute the command
          props.command(editor);
        },
        render: () => {
          // Render function will be overridden in addProseMirrorPlugins with access to options
          return {};
        },
      },
    };
  },

  addProseMirrorPlugins() {
    // Capture options for use in render callbacks
    const extensionOptions = this.options;

    // Create the actual render function with access to options
    const createRender = () => {
      let component: ReactRenderer | null = null;
      let container: HTMLDivElement | null = null;
      let scrollHandler: (() => void) | null = null;
      let resizeHandler: (() => void) | null = null;
      let editorElementRef: HTMLElement | null = null;
      let editorParentRef: HTMLElement | null = null;

      return {
        onStart: (props: SuggestionProps<SlashCommand>) => {
          if (extensionOptions?.suggestionMenuOpenRef) {
            extensionOptions.suggestionMenuOpenRef.current = true;
          }
          component = new ReactRenderer(SlashCommandList, {
            props: {
              items: props.items,
              command: props.command,
            },
            editor: props.editor,
          });

          editorElementRef = props.editor.view.dom as HTMLElement;
          editorParentRef = editorElementRef.parentElement;
          const isMobile = window.innerWidth < 768; // Match mobile breakpoint

          container = document.createElement('div');

          if (isMobile && editorParentRef) {
            // On mobile: use absolute positioning relative to parent
            container.style.zIndex = '0';
            container.style.position = 'absolute';
            editorParentRef.style.position = 'relative';
            editorParentRef.appendChild(container);
          } else {
            // On desktop: use fixed positioning relative to viewport
            container.style.zIndex = '9999';
            container.style.position = 'fixed';
            document.body.appendChild(container);
          }

          container.appendChild(component.element);

          const updatePosition = () => {
            if (!props.clientRect || !container || !editorElementRef) return;
            const editorWidth = editorElementRef.offsetWidth;
            const currentIsMobile = window.innerWidth < 768;

            if (currentIsMobile && editorParentRef) {
              // Mobile: position relative to parent, above input
              const parentRect = editorParentRef.getBoundingClientRect();
              const editorRect = editorElementRef.getBoundingClientRect();

              container.style.left = `${editorRect.left - parentRect.left}px`;
              container.style.width = `${editorWidth}px`;
              container.style.top = `${editorRect.top - parentRect.top}px`;
              container.style.transform = 'translateY(-100%)';
            } else {
              // Desktop: position relative to viewport
              const rect = props.clientRect();
              if (!rect) return;
              container.style.left = `${rect.left}px`;
              container.style.width = `${editorWidth}px`;
              container.style.top = `${rect.bottom + window.scrollY + 4}px`;
            }
          };

          updatePosition();

          scrollHandler = () => updatePosition();
          resizeHandler = () => updatePosition();
          window.addEventListener('scroll', scrollHandler, true);
          window.addEventListener('resize', resizeHandler);
        },
        onUpdate(props: SuggestionProps<SlashCommand>) {
          component?.updateProps({
            items: props.items,
            command: props.command,
          });

          if (props.clientRect && container && editorElementRef) {
            const editorWidth = editorElementRef.offsetWidth;
            const isMobile = window.innerWidth < 768;

            if (isMobile && editorParentRef) {
              // Mobile: position relative to parent, above input
              const parentRect = editorParentRef.getBoundingClientRect();
              const editorRect = editorElementRef.getBoundingClientRect();

              container.style.left = `${editorRect.left - parentRect.left}px`;
              container.style.width = `${editorWidth}px`;
              container.style.top = `${editorRect.top - parentRect.top}px`;
              container.style.transform = 'translateY(-100%)';
            } else {
              // Desktop: position relative to viewport
              const rect = props.clientRect();
              if (!rect) return;
              container.style.left = `${rect.left}px`;
              container.style.width = `${editorWidth}px`;
              container.style.top = `${rect.bottom + window.scrollY + 4}px`;
            }
          }
        },
        onKeyDown(props: SuggestionKeyDownProps) {
          if (props.event.key === 'Escape') {
            if (extensionOptions?.suggestionMenuOpenRef) {
              extensionOptions.suggestionMenuOpenRef.current = false;
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
            editorParentRef = null;
            return true;
          }
          // Handle Enter and Tab when menu is open - prevent form submission
          if (
            (props.event.key === 'Enter' || props.event.key === 'Tab') &&
            component?.ref
          ) {
            const ref = component.ref as {
              onKeyDown?: (props: { event: KeyboardEvent }) => boolean;
            };
            const handled = ref.onKeyDown?.({ event: props.event });
            if (handled) {
              props.event.preventDefault();
              props.event.stopPropagation();
              if (extensionOptions?.suggestionMenuOpenRef) {
                extensionOptions.suggestionMenuOpenRef.current = false;
              }
              return true; // Prevent default behavior (form submission)
            }
          }
          // Always try to handle keyboard navigation even if not Enter/Tab
          if (component?.ref) {
            const ref = component.ref as {
              onKeyDown?: (props: { event: KeyboardEvent }) => boolean;
            };
            return ref.onKeyDown?.({ event: props.event }) ?? false;
          }
          return false;
        },
        onExit() {
          if (extensionOptions?.suggestionMenuOpenRef) {
            extensionOptions.suggestionMenuOpenRef.current = false;
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
          editorParentRef = null;
        },
      };
    };

    return [
      Suggestion({
        ...(this.options.suggestion || {}),
        editor: this.editor,
        render: createRender,
        items: ({ query }: { query: string }) => {
          if (!this.editor) {
            return [];
          }
          const commands = getSlashCommands(this.editor);
          const lowerQuery = query.toLowerCase();

          return commands
            .filter(
              command =>
                command.label.toLowerCase().includes(lowerQuery) ||
                command.description.toLowerCase().includes(lowerQuery)
            )
            .slice(0, 10);
        },
      }),
    ];
  },
});
