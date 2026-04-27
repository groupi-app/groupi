import { useEffect } from 'react';
import { View, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import {
  RichText,
  useEditorBridge,
  useEditorContent,
  Toolbar,
  DEFAULT_TOOLBAR_ITEMS,
  CoreBridge,
  BoldBridge,
  ItalicBridge,
  UnderlineBridge,
  StrikeBridge,
  HeadingBridge,
  BulletListBridge,
  OrderedListBridge,
  BlockquoteBridge,
  CodeBridge,
  LinkBridge,
  ListItemBridge,
  HistoryBridge,
  HardBreakBridge,
  PlaceholderBridge,
} from '@10play/tentap-editor';
import { useCSSVariable } from 'uniwind';
import type { EditorBridge } from '@10play/tentap-editor';

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
  const bgColor = useCSSVariable('--color-background') as string | undefined;
  const textColor = useCSSVariable('--color-foreground') as string | undefined;
  const mutedColor = useCSSVariable('--color-muted-foreground') as
    | string
    | undefined;
  const primaryColor = useCSSVariable('--color-primary') as string | undefined;
  const borderColor = useCSSVariable('--color-border') as string | undefined;

  const customCSS = `
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
      content: attr(data-placeholder);
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
  `;

  const editor = useEditorBridge({
    bridgeExtensions: [
      CoreBridge.configureCSS(customCSS),
      BoldBridge,
      ItalicBridge,
      UnderlineBridge,
      StrikeBridge,
      HeadingBridge,
      BulletListBridge,
      OrderedListBridge,
      ListItemBridge,
      BlockquoteBridge,
      CodeBridge,
      LinkBridge,
      HistoryBridge,
      HardBreakBridge,
      PlaceholderBridge.configureExtension({ placeholder }),
    ],
    initialContent: initialContent || '',
    autofocus: false,
    editable,
    dynamicHeight: true,
  });

  // Reactively track HTML content — avoids circular reference with editor
  const html = useEditorContent(editor, { type: 'html' });

  useEffect(() => {
    if (html !== undefined && onChange) {
      onChange(html);
    }
  }, [html, onChange]);

  return (
    <View className='flex-1'>
      <RichText
        editor={editor}
        style={[
          styles.editor,
          {
            minHeight,
            borderColor: borderColor ?? '#e5e7eb',
            backgroundColor: bgColor ?? '#ffffff',
          },
        ]}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Toolbar editor={editor} items={DEFAULT_TOOLBAR_ITEMS} />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  editor: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export type { EditorBridge };
