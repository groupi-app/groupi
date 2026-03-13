'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import type { Monaco } from '@monaco-editor/react';
import { useBuilder } from './builder-context';
import {
  templateToYaml,
  yamlToTemplate,
  validateTemplate,
} from '@/lib/custom-addon-schema';
import { registerVariableProviders } from './variable-input';
import { getDataBlocks } from './building-blocks';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className='flex h-[500px] items-center justify-center rounded-card border bg-muted'>
      <p className='text-sm text-muted-foreground'>Loading editor...</p>
    </div>
  ),
});

const THEME_NAME = 'groupi-custom';

/**
 * Read a CSS custom property from the document and return it as a hex color.
 * Falls back to `fallback` if the variable is missing or unparseable.
 */
function cssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  if (!raw) return fallback;

  // Convert HSL value like "270 45% 7%" to hex
  if (/^\d/.test(raw)) {
    return hslToHex(raw);
  }
  // Already hsl() or hex
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

function defineGroupiTheme(monaco: Monaco, isDark: boolean) {
  const bg = cssVar('--background', isDark ? '#1a1025' : '#ffffff');
  const fg = cssVar('--foreground', isDark ? '#e8dff0' : '#1e293b');
  const card = cssVar('--card', isDark ? '#221533' : '#ffffff');
  const muted = cssVar('--muted', isDark ? '#2a1a3d' : '#f1f5f9');
  const mutedFg = cssVar('--muted-foreground', isDark ? '#8b7a9e' : '#64748b');
  const border = cssVar('--border', isDark ? '#3d2a57' : '#e2e8f0');
  const primary = cssVar('--primary', isDark ? '#b366e0' : '#6b00a8');
  const accent = cssVar('--accent', isDark ? '#3d2157' : '#f0e6f6');
  const destructive = cssVar('--destructive', isDark ? '#cc4444' : '#dc2626');

  monaco.editor.defineTheme(THEME_NAME, {
    base: isDark ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [
      {
        token: 'comment',
        foreground: mutedFg.replace('#', ''),
        fontStyle: 'italic',
      },
      { token: 'string', foreground: primary.replace('#', '') },
      {
        token: 'keyword',
        foreground: primary.replace('#', ''),
        fontStyle: 'bold',
      },
      { token: 'number', foreground: primary.replace('#', '') },
      { token: 'type', foreground: fg.replace('#', '') },
    ],
    colors: {
      'editor.background': bg,
      'editor.foreground': fg,
      'editor.lineHighlightBackground': accent,
      'editor.selectionBackground': accent,
      'editor.inactiveSelectionBackground': muted,
      'editorLineNumber.foreground': mutedFg,
      'editorLineNumber.activeForeground': fg,
      'editorCursor.foreground': primary,
      'editorWhitespace.foreground': border,
      'editorIndentGuide.background': border,
      'editorIndentGuide.activeBackground': mutedFg,
      'editor.selectionHighlightBackground': accent,
      'editorBracketMatch.background': accent,
      'editorBracketMatch.border': primary,
      'editorWidget.background': card,
      'editorWidget.foreground': fg,
      'editorWidget.border': border,
      'editorSuggestWidget.background': card,
      'editorSuggestWidget.border': border,
      'editorSuggestWidget.foreground': fg,
      'editorSuggestWidget.selectedBackground': accent,
      'editorHoverWidget.background': card,
      'editorHoverWidget.border': border,
      'editorError.foreground': destructive,
      'scrollbarSlider.background': muted,
      'scrollbarSlider.hoverBackground': mutedFg,
      'scrollbarSlider.activeBackground': mutedFg,
      'minimap.background': bg,
    },
  });
}

export function YamlEditor() {
  const { template, setTemplate, lastEditor, setLastEditor } = useBuilder();
  const { resolvedTheme } = useTheme();
  const [yamlValue, setYamlValue] = useState(() => templateToYaml(template));
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const templateRef = useRef(template);
  useEffect(() => {
    templateRef.current = template;
  }, [template]);

  const isDark = resolvedTheme === 'dark';

  // Re-define theme when the app theme changes
  useEffect(() => {
    if (!monacoRef.current) return;
    defineGroupiTheme(monacoRef.current, isDark);
    monacoRef.current.editor.setTheme(THEME_NAME);
  }, [isDark, resolvedTheme]);

  const handleEditorMount = useCallback(
    (_editor: unknown, monaco: Monaco) => {
      monacoRef.current = monaco;
      defineGroupiTheme(monaco, isDark);
      monaco.editor.setTheme(THEME_NAME);

      // Variable autocomplete + hover tooltips in YAML string values
      registerVariableProviders(monaco, 'yaml', () =>
        getDataBlocks(templateRef.current)
      );
    },
    [isDark]
  );

  // Sync from visual editor → YAML (when visual editor changes)
  const yamlFromTemplate =
    lastEditor !== 'yaml' ? templateToYaml(template) : null;
  if (yamlFromTemplate !== null && yamlFromTemplate !== yamlValue) {
    setYamlValue(yamlFromTemplate);
    setParseErrors([]);
  }

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (!value) return;
      setYamlValue(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        const result = yamlToTemplate(value);
        if (result.error) {
          setParseErrors([result.error]);
          return;
        }

        if (!result.template) return;

        const validation = validateTemplate(result.template);
        if (!validation.valid) {
          setParseErrors(validation.errorMessages);
        } else {
          setParseErrors([]);
        }

        setLastEditor('yaml');
        setTemplate(result.template);
      }, 300);
    },
    [setTemplate, setLastEditor]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className='space-y-2'>
      <MonacoEditor
        height='500px'
        language='yaml'
        theme={THEME_NAME}
        value={yamlValue}
        onChange={handleEditorChange}
        onMount={handleEditorMount}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          tabSize: 2,
          automaticLayout: true,
          padding: { top: 12 },
          roundedSelection: true,
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
        }}
      />
      {parseErrors.length > 0 && (
        <div className='rounded-card border border-border-error bg-bg-error-subtle p-3'>
          <p className='mb-1 text-sm font-medium text-error'>
            {parseErrors.length === 1
              ? 'Error'
              : `${parseErrors.length} errors`}
          </p>
          <ul className='space-y-0.5 text-xs text-error'>
            {parseErrors.map((err, i) => (
              <li key={i}>• {err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
