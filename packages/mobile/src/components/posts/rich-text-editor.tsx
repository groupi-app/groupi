import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import {
  RichText,
  useEditorBridge,
  useEditorContent,
} from '@10play/tentap-editor';
import { useCSSVariable } from 'uniwind';
import type { EditorBridge } from '@10play/tentap-editor';
import type { WebViewMessageEvent } from 'react-native-webview';

import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';

const SLASH_QUERY_MESSAGE = 'groupi-slash-query';
const EDITOR_READY_MESSAGE = 'editor-ready';

const SLASH_COMMAND_SCRIPT = `
  (() => {
    if (window.__groupiPublishSlashQuery) {
      document.removeEventListener(
        'input',
        window.__groupiPublishSlashQuery,
        true
      );
      document.removeEventListener(
        'keyup',
        window.__groupiPublishSlashQuery,
        true
      );
      document.removeEventListener(
        'selectionchange',
        window.__groupiPublishSlashQuery,
        true
      );
    }
    let lastQuery;
    const publishQuery = () => {
      const selection = window.getSelection();
      const node = selection?.anchorNode;
      let query = null;
      if (
        selection?.isCollapsed &&
        node?.nodeType === Node.TEXT_NODE &&
        typeof selection.anchorOffset === 'number'
      ) {
        const beforeCursor = (node.textContent || '').slice(
          0,
          selection.anchorOffset
        );
        const match = beforeCursor.match(/(?:^|\\s)\\/([a-z0-9 ]*)$/i);
        query = match ? match[1] : null;
      }
      if (query === lastQuery) return;
      lastQuery = query;
      window.ReactNativeWebView?.postMessage(
        JSON.stringify({ type: '${SLASH_QUERY_MESSAGE}', payload: query })
      );
    };
    window.__groupiPublishSlashQuery = publishQuery;
    document.addEventListener('input', publishQuery, true);
    document.addEventListener('keyup', publishQuery, true);
    document.addEventListener('selectionchange', publishQuery, true);
    publishQuery();
    true;
  })();
`;

const REMOVE_SLASH_QUERY_SCRIPT = `
  (() => {
    const selection = window.getSelection();
    const node = selection?.anchorNode;
    if (
      !selection?.isCollapsed ||
      !node ||
      node.nodeType !== Node.TEXT_NODE ||
      typeof selection.anchorOffset !== 'number'
    ) return true;
    const beforeCursor = (node.textContent || '').slice(0, selection.anchorOffset);
    const match = beforeCursor.match(/(^|\\s)\\/[a-z0-9 ]*$/i);
    if (!match) return true;
    const prefixLength = match[1]?.length || 0;
    const range = document.createRange();
    range.setStart(
      node,
      selection.anchorOffset - match[0].length + prefixLength
    );
    range.setEnd(node, selection.anchorOffset);
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('insertText', false, '');
    true;
  })();
`;

export function getTrailingSlashQuery(html: string): string | null {
  const text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|h[1-6]|blockquote)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .trimEnd();
  return text.match(/(?:^|\s)\/([a-z0-9 ]*)$/i)?.[1] ?? null;
}

interface SlashCommand {
  id: string;
  label: string;
  description: string;
  keywords: string;
  run: (editor: EditorBridge) => void;
}

const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'heading-1',
    label: 'Heading 1',
    description: 'Large section heading',
    keywords: 'h1 title',
    run: editor => editor.toggleHeading(1),
  },
  {
    id: 'heading-2',
    label: 'Heading 2',
    description: 'Medium section heading',
    keywords: 'h2 subtitle',
    run: editor => editor.toggleHeading(2),
  },
  {
    id: 'bullet-list',
    label: 'Bullet list',
    description: 'Create an unordered list',
    keywords: 'ul unordered bullets',
    run: editor => editor.toggleBulletList(),
  },
  {
    id: 'numbered-list',
    label: 'Numbered list',
    description: 'Create an ordered list',
    keywords: 'ol ordered numbers',
    run: editor => editor.toggleOrderedList(),
  },
  {
    id: 'check-list',
    label: 'Check list',
    description: 'Create a list of tasks',
    keywords: 'todo task checkbox',
    run: editor => editor.toggleTaskList(),
  },
  {
    id: 'quote',
    label: 'Quote',
    description: 'Emphasize a quotation',
    keywords: 'blockquote citation',
    run: editor => editor.toggleBlockquote(),
  },
];

interface RichTextEditorProps {
  initialContent?: string;
  placeholder?: string;
  onChange?: (html: string) => void;
  editable?: boolean;
  minHeight?: number;
}

export function RichTextEditor({
  initialContent,
  placeholder = "What's on your mind?",
  onChange,
  editable = true,
  minHeight = 200,
}: RichTextEditorProps) {
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const bgColor = useCSSVariable('--color-background') as string | undefined;
  const textColor = useCSSVariable('--color-foreground') as string | undefined;
  const mutedColor = useCSSVariable('--color-muted-foreground') as
    | string
    | undefined;
  const primaryColor = useCSSVariable('--color-primary') as string | undefined;
  const borderColor = useCSSVariable('--color-border') as string | undefined;

  const customCSS = useMemo(
    () => `
    body {
      background-color: ${bgColor ?? '#ffffff'};
      color: ${textColor ?? '#1a1a1a'};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      padding: 12px;
      min-height: ${minHeight}px;
    }
    .tiptap p.is-editor-empty:first-child::before {
      color: ${mutedColor ?? '#9ca3af'};
      content: ${JSON.stringify(placeholder)};
      float: left;
      height: 0;
      pointer-events: none;
    }
    a { color: ${primaryColor ?? '#8b00b8'}; }
    blockquote {
      border-left: 3px solid ${borderColor ?? '#e5e7eb'};
      padding-left: 12px;
      color: ${mutedColor ?? '#9ca3af'};
    }
    code {
      background-color: ${borderColor ?? '#e5e7eb'};
      border-radius: 4px;
      padding: 2px 4px;
      font-size: 14px;
    }
    h1 { font-size: 24px; font-weight: 700; margin: 8px 0; }
    h2 { font-size: 20px; font-weight: 700; margin: 6px 0; }
    h3 { font-size: 18px; font-weight: 600; margin: 4px 0; }
    ul, ol { padding-left: 24px; }
    li { margin: 2px 0; }
  `,
    [
      bgColor,
      borderColor,
      minHeight,
      mutedColor,
      placeholder,
      primaryColor,
      textColor,
    ]
  );

  const editorTheme = useMemo(
    () => ({
      webview: {
        backgroundColor: bgColor ?? '#ffffff',
      },
      webviewContainer: {
        backgroundColor: bgColor ?? '#ffffff',
      },
    }),
    [bgColor]
  );
  const editor = useEditorBridge({
    initialContent: initialContent || '<p></p>',
    autofocus: false,
    avoidIosKeyboard: true,
    editable,
    dynamicHeight: false,
    theme: editorTheme,
  });
  const editorRef = useRef(editor);
  const slashMessageVersionRef = useRef(0);

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    editorRef.current.injectCSS(customCSS, 'groupi-theme');
  }, [customCSS]);

  const handleEditorLoad = useCallback(() => {
    editorRef.current.injectCSS(customCSS, 'groupi-theme');
    editorRef.current.injectJS(SLASH_COMMAND_SCRIPT);
  }, [customCSS]);

  const handleEditorLoadStart = useCallback(() => {
    setIsEditorReady(false);
  }, []);

  const handleEditorMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        payload?: unknown;
      };
      if (message.type === EDITOR_READY_MESSAGE) {
        setIsEditorReady(true);
        return;
      }
      if (message.type !== SLASH_QUERY_MESSAGE) return;
      slashMessageVersionRef.current += 1;
      setSlashQuery(
        typeof message.payload === 'string' ? message.payload : null
      );
    } catch {
      // Tentap owns the remaining WebView messages.
    }
  }, []);

  const matchingCommands = useMemo(() => {
    if (slashQuery === null) return [];
    const query = slashQuery.trim().toLowerCase();
    return SLASH_COMMANDS.filter(command =>
      `${command.label} ${command.keywords}`.toLowerCase().includes(query)
    );
  }, [slashQuery]);

  const runSlashCommand = useCallback(
    (command: SlashCommand) => {
      setSlashQuery(null);
      editor.injectJS(REMOVE_SLASH_QUERY_SCRIPT);
      setTimeout(() => {
        editor.focus('end');
        command.run(editor);
      }, 50);
    },
    [editor]
  );

  // Reactively track HTML content — avoids circular reference with editor
  const html = useEditorContent(editor, { type: 'html' });

  useEffect(() => {
    if (html === undefined) return;
    const trailingQuery = getTrailingSlashQuery(html);
    if (trailingQuery === null) return;
    const messageVersion = slashMessageVersionRef.current;
    const update = setTimeout(() => {
      if (slashMessageVersionRef.current === messageVersion) {
        setSlashQuery(trailingQuery);
      }
    }, 0);
    return () => clearTimeout(update);
  }, [html]);

  useEffect(() => {
    if (html !== undefined && onChange) {
      onChange(html);
    }
  }, [html, onChange]);

  return (
    <View
      style={[
        styles.container,
        {
          minHeight,
          borderColor: borderColor ?? '#e5e7eb',
          backgroundColor: bgColor ?? '#ffffff',
        },
      ]}
    >
      <RichText
        editor={editor}
        exclusivelyUseCustomOnMessage={false}
        onLoad={handleEditorLoad}
        onLoadStart={handleEditorLoadStart}
        onMessage={handleEditorMessage}
        style={styles.editor}
      />
      {!isEditorReady ? (
        <View
          className='absolute inset-0 bg-background px-3 py-4'
          pointerEvents='none'
          accessibilityRole='progressbar'
          accessibilityLabel='Loading editor'
          accessibilityLiveRegion='polite'
        >
          <Skeleton className='mb-5 h-4 w-2/5 rounded-soft' />
          <Skeleton className='mb-3 h-3 w-full rounded-soft' />
          <Skeleton className='mb-3 h-3 w-4/5 rounded-soft' />
          <Skeleton className='h-3 w-3/5 rounded-soft' />
        </View>
      ) : null}
      {editable && slashQuery !== null ? (
        <View
          className='absolute left-2 right-2 top-2 overflow-hidden rounded-card border border-border bg-popover shadow-floating'
          accessibilityRole='menu'
          accessibilityLabel='Formatting commands'
        >
          {matchingCommands.length > 0 ? (
            matchingCommands.map(command => (
              <Pressable
                key={command.id}
                onPress={() => runSlashCommand(command)}
                className='min-h-11 justify-center border-b border-border px-3 py-2 active:bg-muted'
                accessibilityRole='menuitem'
                accessibilityLabel={command.label}
                accessibilityHint={command.description}
              >
                <Text className='font-semibold text-popover-foreground'>
                  {command.label}
                </Text>
                <Text className='text-xs text-muted-foreground'>
                  {command.description}
                </Text>
              </Pressable>
            ))
          ) : (
            <View className='min-h-11 justify-center px-3 py-2'>
              <Text className='text-sm text-muted-foreground'>
                No matching commands
              </Text>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  editor: {
    flex: 1,
  },
});

export type { EditorBridge };
