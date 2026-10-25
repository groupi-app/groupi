'use client';

import { useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import type { Monaco, OnMount } from '@monaco-editor/react';
import { cn } from '@/lib/utils';
import { useBuilder } from './builder-context';
import type { DataBlock } from './building-blocks';

type MonacoEditor = Parameters<OnMount>[0];

const MonacoEditorComponent = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className='flex h-10 items-center rounded-input border bg-muted px-4'>
      <span className='text-xs text-muted-foreground'>Loading...</span>
    </div>
  ),
});

const LANG_ID = 'groupi-template';
const THEME_NAME = 'groupi-variable';
let languageRegistered = false;

// ===== CSS variable reading =====

function cssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  if (!raw) return fallback;
  if (/^\d/.test(raw)) return hslToHex(raw);
  if (raw.startsWith('hsl')) {
    const inner = raw.replace(/hsl\(([^)]+)\)/, '$1');
    return hslToHex(inner);
  }
  if (raw.startsWith('#')) return raw;
  return fallback;
}

function hslToHex(hslStr: string): string {
  const parts = hslStr.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
  if (parts.length < 3) return '#888888';
  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (c: number) =>
    Math.round(c * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function defineTheme(monaco: Monaco, isDark: boolean) {
  const bg = cssVar('--background', isDark ? '#1a1025' : '#ffffff');
  const fg = cssVar('--foreground', isDark ? '#e8dff0' : '#1e293b');
  const primary = cssVar('--primary', isDark ? '#b366e0' : '#6b00a8');
  const primaryFg = cssVar(
    '--primary-foreground',
    isDark ? '#ffffff' : '#ffffff'
  );
  const mutedFg = cssVar('--muted-foreground', isDark ? '#8b7a9e' : '#64748b');
  const accent = cssVar('--accent', isDark ? '#3d2157' : '#f0e6f6');
  const border = cssVar('--border', isDark ? '#3d2a57' : '#e2e8f0');
  const card = cssVar('--card', isDark ? '#221533' : '#ffffff');
  const popover = cssVar('--popover', isDark ? '#221533' : '#ffffff');
  const popoverFg = cssVar(
    '--popover-foreground',
    isDark ? '#e8dff0' : '#1e293b'
  );

  monaco.editor.defineTheme(THEME_NAME, {
    base: isDark ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [
      {
        token: 'variable.template',
        foreground: primary.replace('#', ''),
        fontStyle: 'bold',
      },
      {
        token: 'delimiter.template',
        foreground: mutedFg.replace('#', ''),
      },
    ],
    colors: {
      'editor.background': bg,
      'editor.foreground': fg,
      'editor.lineHighlightBackground': bg,
      'editor.selectionBackground': accent,
      'editorCursor.foreground': primary,
      'editor.lineHighlightBorder': '#00000000',
      'editorWidget.background': card,
      'editorWidget.border': border,
      'editorWidget.foreground': fg,
      'editorHoverWidget.background': popover,
      'editorHoverWidget.border': border,
      'editorHoverWidget.foreground': popoverFg,
      'editorSuggestWidget.background': popover,
      'editorSuggestWidget.border': border,
      'editorSuggestWidget.foreground': popoverFg,
      'editorSuggestWidget.selectedBackground': primary,
      'editorSuggestWidget.selectedForeground': primaryFg,
      'editorSuggestWidget.highlightForeground': primary,
      'editorSuggestWidget.focusHighlightForeground': primaryFg,
      'list.hoverBackground': accent,
      'list.hoverForeground': fg,
      'scrollbar.shadow': '#00000000',
    },
  });
}

function registerLanguage(monaco: Monaco) {
  if (languageRegistered) return;
  languageRegistered = true;

  monaco.languages.register({ id: LANG_ID });

  monaco.languages.setMonarchTokensProvider(LANG_ID, {
    tokenizer: {
      root: [
        [/\{\{/, 'delimiter.template', '@variable'],
        [/[^{]+/, ''],
        [/\{/, ''],
      ],
      variable: [
        [/\}\}/, 'delimiter.template', '@pop'],
        [/[^}]+/, 'variable.template'],
      ],
    },
  });
}

const PROVIDER_STORAGE_KEY = '__groupi_var_providers_';

/**
 * Register variable completion and hover providers for a language.
 * Stores disposables on the Monaco instance itself so they survive HMR
 * (module-level state gets reset on HMR, but the Monaco instance persists).
 */
export function registerVariableProviders(
  monaco: Monaco,
  language: string,
  getDataBlocks: () => DataBlock[]
) {
  // Dispose any existing providers — stored on the monaco instance
  const storageKey = `${PROVIDER_STORAGE_KEY}${language}`;
  const monacoAny = monaco as Record<string, unknown>;
  const existing = monacoAny[storageKey] as
    | Array<{ dispose: () => void }>
    | undefined;
  if (existing) {
    existing.forEach(d => d.dispose());
  }
  const disposables: Array<{ dispose: () => void }> = [];
  monacoAny[storageKey] = disposables;
  type ITextModel = Parameters<
    Parameters<
      typeof monaco.languages.registerCompletionItemProvider
    >[1]['provideCompletionItems']
  >[0];
  type IPosition = Parameters<
    Parameters<
      typeof monaco.languages.registerCompletionItemProvider
    >[1]['provideCompletionItems']
  >[1];

  disposables.push(
    monaco.languages.registerCompletionItemProvider(language, {
      triggerCharacters: ['{'],
      provideCompletionItems: (model: ITextModel, position: IPosition) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        const lastOpen = textUntilPosition.lastIndexOf('{{');
        if (lastOpen === -1) return { suggestions: [] };

        const afterOpen = textUntilPosition.slice(lastOpen + 2);
        if (afterOpen.includes('}}')) return { suggestions: [] };

        // Range starts after `{{` so Monaco filters against the path text
        const range = {
          startLineNumber: position.lineNumber,
          startColumn: lastOpen + 3,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        };

        return {
          suggestions: getDataBlocks().map(b => ({
            label: b.path,
            detail: b.label,
            documentation: b.description,
            insertText: `${b.path}}}`,
            range,
            kind: monaco.languages.CompletionItemKind.Variable,
          })),
        };
      },
    })
  );

  disposables.push(
    monaco.languages.registerHoverProvider(language, {
      provideHover: (model: ITextModel, position: IPosition) => {
        const line = model.getLineContent(position.lineNumber);
        const varRegex = /\{\{([^}]+)\}\}/g;
        let match: RegExpExecArray | null;

        while ((match = varRegex.exec(line)) !== null) {
          const startCol = match.index + 1;
          const endCol = match.index + match[0].length + 1;

          if (position.column >= startCol && position.column <= endCol) {
            const path = match[1].trim();
            const block = getDataBlocks().find(b => b.path === path);
            const label = block?.label ?? path;
            const desc = block?.description ?? 'Unknown variable';

            return {
              range: {
                startLineNumber: position.lineNumber,
                startColumn: startCol,
                endLineNumber: position.lineNumber,
                endColumn: endCol,
              },
              contents: [{ value: `**${label}**` }, { value: desc }],
            };
          }
        }
        return null;
      },
    })
  );
}

// ===== Component =====

interface VariableInputProps {
  value: string;
  onChange: (value: string) => void;
  dataBlocks: DataBlock[];
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  rows?: number;
}

export function VariableInput({
  value,
  onChange,
  dataBlocks,
  multiline = false,
  placeholder,
  className,
  rows,
}: VariableInputProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<MonacoEditor | null>(null);
  const { setActiveVariableTarget } = useBuilder();
  const dataBlocksRef = useRef(dataBlocks);
  useEffect(() => {
    dataBlocksRef.current = dataBlocks;
  }, [dataBlocks]);

  const lineCount = multiline ? (rows ?? 3) : 1;
  // ~20px per line + padding
  const editorHeight = lineCount * 20 + 12;

  useEffect(() => {
    if (!monacoRef.current) return;
    defineTheme(monacoRef.current, isDark);
    monacoRef.current.editor.setTheme(THEME_NAME);
  }, [isDark]);

  const handleMount: OnMount = useCallback(
    (ed, monaco) => {
      monacoRef.current = monaco;
      editorRef.current = ed;

      registerLanguage(monaco);
      defineTheme(monaco, isDark);
      monaco.editor.setTheme(THEME_NAME);

      // Variable completion + hover
      registerVariableProviders(monaco, LANG_ID, () => dataBlocksRef.current);

      // Show placeholder
      if (!value && placeholder) {
        updatePlaceholder(ed, placeholder);
      }

      // Register as active variable target when focused
      ed.onDidFocusEditorText(() => {
        setActiveVariableTarget({
          insert: (variable: string) => {
            const selection = ed.getSelection();
            if (selection) {
              ed.executeEdits('variable-insert', [
                { range: selection, text: variable },
              ]);
            }
          },
        });
      });

      ed.onDidBlurEditorText(() => {
        setActiveVariableTarget(null);
      });
    },
    [isDark, value, placeholder, setActiveVariableTarget]
  );

  const handleChange = useCallback(
    (val: string | undefined) => {
      onChange(val ?? '');
    },
    [onChange]
  );

  return (
    <div
      className={cn(
        'overflow-hidden rounded-input border border-input transition-all duration-fast focus-within:border-primary focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
        className
      )}
    >
      <MonacoEditorComponent
        height={editorHeight}
        language={LANG_ID}
        theme={THEME_NAME}
        value={value}
        onChange={handleChange}
        onMount={handleMount}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'off',
          glyphMargin: false,
          folding: false,
          lineDecorationsWidth: 8,
          lineNumbersMinChars: 0,
          wordWrap: multiline ? 'on' : 'off',
          wrappingStrategy: 'advanced',
          scrollBeyondLastLine: false,
          scrollbar: {
            vertical: multiline ? 'auto' : 'hidden',
            horizontal: 'hidden',
            verticalScrollbarSize: 6,
          },
          overviewRulerLanes: 0,
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          renderLineHighlight: 'none',
          cursorBlinking: 'smooth',
          automaticLayout: true,
          fixedOverflowWidgets: true,
          padding: { top: 6, bottom: 6 },
          suggest: { showIcons: true, showStatusBar: false },
          quickSuggestions: false,
          parameterHints: { enabled: false },
          tabSize: 2,
          contextmenu: false,
          ...(multiline ? {} : { wordWrap: 'off' as const }),
        }}
      />
    </div>
  );
}

// ===== Placeholder =====

function updatePlaceholder(editor: MonacoEditor, text: string) {
  const model = editor.getModel();
  if (!model) return;

  const updateVisibility = () => {
    const domNode = editor.getDomNode();
    if (!domNode) return;
    let el = domNode.querySelector('.monaco-placeholder') as HTMLElement | null;

    if (model.getValue().length === 0) {
      if (!el) {
        el = document.createElement('div');
        el.className = 'monaco-placeholder';
        el.style.cssText =
          'position:absolute;top:6px;left:14px;pointer-events:none;opacity:0.5;font-size:13px;';
        el.textContent = text;
        const linesContent = domNode.querySelector('.view-lines');
        linesContent?.parentElement?.appendChild(el);
      }
      el.style.display = '';
    } else if (el) {
      el.style.display = 'none';
    }
  };

  model.onDidChangeContent(updateVisibility);
  requestAnimationFrame(updateVisibility);
}
