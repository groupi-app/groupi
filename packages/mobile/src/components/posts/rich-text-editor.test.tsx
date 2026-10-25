import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  editor: {
    focus: vi.fn(),
    injectCSS: vi.fn(),
    injectJS: vi.fn(),
    toggleHeading: vi.fn(),
    toggleBulletList: vi.fn(),
    toggleOrderedList: vi.fn(),
    toggleTaskList: vi.fn(),
    toggleBlockquote: vi.fn(),
  },
  editorReady: false,
  setEditorReady: vi.fn(),
  setSlashQuery: vi.fn(),
  slashQuery: null as string | null,
  useEditorBridge: vi.fn(),
  useEditorContent: vi.fn(),
}));

vi.mock('react', async importOriginal => {
  const actual = (await importOriginal()) as typeof import('react');
  return {
    ...actual,
    useCallback: <T extends (...args: never[]) => unknown>(callback: T) =>
      callback,
    useEffect: (effect: () => void | (() => void)) => effect(),
    useMemo: <T,>(factory: () => T) => factory(),
    useRef: <T,>(initialValue: T) => ({ current: initialValue }),
    useState: <T,>(initialValue: T) =>
      typeof initialValue === 'boolean'
        ? [mocks.editorReady, mocks.setEditorReady]
        : [
            mocks.slashQuery === null ? initialValue : mocks.slashQuery,
            mocks.setSlashQuery,
          ],
  };
});

vi.mock('@10play/tentap-editor', () => ({
  RichText: 'RichText',
  useEditorBridge: mocks.useEditorBridge,
  useEditorContent: mocks.useEditorContent,
}));

vi.mock('uniwind', () => ({
  useCSSVariable: (name: string) =>
    ({
      '--color-background': '#ffffff',
      '--color-foreground': '#111111',
      '--color-muted-foreground': '#666666',
      '--color-primary': '#8000a8',
      '--color-border': '#dddddd',
    })[name],
}));

vi.mock('../ui/text', () => ({ Text: 'Text' }));
vi.mock('../ui/skeleton', () => ({ Skeleton: 'Skeleton' }));

import { getTrailingSlashQuery, RichTextEditor } from './rich-text-editor';

function descendantWithType(
  tree: ReactNode,
  type: string
): ReactElement<Record<string, unknown>> {
  for (const child of Children.toArray(tree)) {
    if (!isValidElement<Record<string, unknown>>(child)) continue;
    if (child.type === type) return child;
    try {
      return descendantWithType(child.props.children as ReactNode, type);
    } catch {
      // Search the next branch.
    }
  }
  throw new Error(`${type} was not rendered`);
}

function descendantWithAccessibilityLabel(
  tree: ReactNode,
  label: string
): ReactElement<Record<string, unknown>> {
  for (const child of Children.toArray(tree)) {
    if (!isValidElement<Record<string, unknown>>(child)) continue;
    if (child.props.accessibilityLabel === label) return child;
    try {
      return descendantWithAccessibilityLabel(
        child.props.children as ReactNode,
        label
      );
    } catch {
      // Search the next branch.
    }
  }
  throw new Error(`${label} was not rendered`);
}

describe('RichTextEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.editorReady = false;
    mocks.slashQuery = null;
    mocks.useEditorBridge.mockReturnValue(mocks.editor);
    mocks.useEditorContent.mockReturnValue('<p>Updated body</p>');
  });

  it('uses the supported full-height editor bridge without a toolbar', () => {
    const tree = RichTextEditor({});

    expect(mocks.useEditorBridge).toHaveBeenCalledWith(
      expect.objectContaining({
        initialContent: '<p></p>',
        autofocus: false,
        avoidIosKeyboard: true,
        dynamicHeight: false,
        editable: true,
      })
    );
    expect(mocks.useEditorBridge.mock.calls[0][0]).not.toHaveProperty(
      'bridgeExtensions'
    );

    const richText = descendantWithType(tree, 'RichText');
    expect(richText.props.exclusivelyUseCustomOnMessage).toBe(false);
    expect(
      Children.toArray(tree.props.children as ReactNode).some(
        child => isValidElement(child) && child.type === 'Toolbar'
      )
    ).toBe(false);
    expect(
      descendantWithAccessibilityLabel(tree, 'Loading editor')
    ).toBeTruthy();
  });

  it('applies the placeholder and Groupi theme after the WebView loads', () => {
    const tree = RichTextEditor({ placeholder: 'Share an update' });
    const richText = descendantWithType(tree, 'RichText');
    mocks.editor.injectCSS.mockClear();

    (richText.props.onLoad as () => void)();

    expect(mocks.editor.injectCSS).toHaveBeenCalledWith(
      expect.stringMatching(/color: #111111[\s\S]*content: "Share an update"/),
      'groupi-theme'
    );
    expect(mocks.editor.injectJS).toHaveBeenCalledWith(
      expect.stringContaining('groupi-slash-query')
    );

    (richText.props.onLoadStart as () => void)();
    expect(mocks.setEditorReady).toHaveBeenCalledWith(false);

    (richText.props.onMessage as (event: unknown) => void)({
      nativeEvent: {
        data: JSON.stringify({ type: 'editor-ready' }),
      },
    });
    expect(mocks.setEditorReady).toHaveBeenCalledWith(true);

    (richText.props.onMessage as (event: unknown) => void)({
      nativeEvent: {
        data: JSON.stringify({
          type: 'groupi-slash-query',
          payload: 'hea',
        }),
      },
    });
    expect(mocks.setSlashQuery).toHaveBeenCalledWith('hea');
  });

  it('preserves existing HTML and publishes editor updates', () => {
    const onChange = vi.fn();

    RichTextEditor({
      initialContent: '<p>Original body</p>',
      onChange,
      editable: false,
    });

    expect(mocks.useEditorBridge).toHaveBeenCalledWith(
      expect.objectContaining({
        initialContent: '<p>Original body</p>',
        editable: false,
      })
    );
    expect(onChange).toHaveBeenCalledWith('<p>Updated body</p>');
  });

  it('supports a compact accessible reply editor', () => {
    const tree = RichTextEditor({
      variant: 'compact',
      minHeight: 76,
      autofocus: true,
      accessibilityLabel: 'Write a reply',
    });

    expect(mocks.useEditorBridge).toHaveBeenCalledWith(
      expect.objectContaining({
        autofocus: true,
        initialContent: '<p></p>',
      })
    );
    const richText = descendantWithType(tree, 'RichText');
    expect(richText.props.scrollEnabled).toBe(true);
    expect(richText.props.bounces).toBe(false);
    expect(richText.props.accessibilityLabel).toBe('Write a reply');
    expect(mocks.editor.injectCSS).toHaveBeenCalledWith(
      expect.stringMatching(/padding: 8px 10px[\s\S]*p \{ margin: 0; \}/),
      'groupi-theme'
    );
  });

  it('runs slash commands after removing the typed query', () => {
    vi.useFakeTimers();
    mocks.slashQuery = 'heading';
    const tree = RichTextEditor({});
    const commandMenu = Children.toArray(tree.props.children as ReactNode).find(
      child =>
        isValidElement<Record<string, unknown>>(child) &&
        child.props.accessibilityRole === 'menu'
    );
    if (!isValidElement<Record<string, unknown>>(commandMenu)) {
      throw new Error('Slash command menu was not rendered');
    }
    const heading = Children.toArray(
      commandMenu.props.children as ReactNode
    ).find(
      child =>
        isValidElement<Record<string, unknown>>(child) &&
        child.props.accessibilityLabel === 'Heading 1'
    );
    if (!isValidElement<Record<string, unknown>>(heading)) {
      throw new Error('Heading command was not rendered');
    }

    (heading.props.onPress as () => void)();
    vi.runAllTimers();

    expect(mocks.setSlashQuery).toHaveBeenCalledWith(null);
    expect(mocks.editor.injectJS).toHaveBeenCalledWith(
      expect.stringContaining("document.execCommand('insertText'")
    );
    expect(mocks.editor.focus).toHaveBeenCalledWith('end');
    expect(mocks.editor.toggleHeading).toHaveBeenCalledWith(1);
    vi.useRealTimers();
  });

  it('detects slash queries from editor content as an input-event fallback', () => {
    expect(getTrailingSlashQuery('<p>/</p>')).toBe('');
    expect(getTrailingSlashQuery('<p>Intro</p><p>/head</p>')).toBe('head');
    expect(getTrailingSlashQuery('<p>https://groupi.gg</p>')).toBeNull();

    vi.useFakeTimers();
    mocks.useEditorContent.mockReturnValue('<p>/quote</p>');
    RichTextEditor({});
    vi.runAllTimers();
    expect(mocks.setSlashQuery).toHaveBeenCalledWith('quote');
    vi.useRealTimers();
  });
});
