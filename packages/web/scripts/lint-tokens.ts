/**
 * Design Token Lint Script
 *
 * Scans all TSX/JSX files for usage of non-token Tailwind classes.
 * Helps enforce design system consistency by warning about:
 * - Hardcoded colors (bg-red-500, text-blue-400)
 * - Default shadows (shadow-lg, shadow-md)
 * - Default border radius (rounded-xl)
 * - Numeric z-index (z-50)
 * - Arbitrary values ([color], [#hex])
 *
 * Usage: npx tsx scripts/lint-tokens.ts [--fix-suggestions]
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// CONFIGURATION
// =============================================================================

// Files/directories to ignore
const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/.next/**',
  '**/dist/**',
  '**/coverage/**',
  '**/*.test.tsx',
  '**/*.test.ts',
  '**/*.stories.tsx',
  '**/scripts/**',
];

// Classes that are allowed even though they match violation patterns
// Add file-specific exceptions: { 'path/to/file.tsx': ['class1', 'class2'] }
const EXCEPTIONS: Record<string, string[]> = {
  // Global exceptions (apply to all files)
  '*': [
    // Keep white/black/transparent as they're semantic
    'bg-white',
    'bg-black',
    'text-white',
    'text-black',
    'border-white',
    'border-black',
    'bg-transparent',
    'border-transparent',
    // Common utility patterns that don't have token equivalents
    'shadow-none',
    'rounded-none',
    'rounded-full',
    'z-0',
  ],
  // Example file-specific exception:
  // 'components/legacy/OldComponent.tsx': ['bg-gray-100', 'text-gray-500'],
};

// =============================================================================
// VIOLATION PATTERNS
// =============================================================================

interface ViolationPattern {
  name: string;
  pattern: RegExp;
  suggestion: string;
  severity: 'warn' | 'error';
}

const VIOLATION_PATTERNS: ViolationPattern[] = [
  // Hardcoded color classes
  {
    name: 'Hardcoded color (red)',
    pattern:
      /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|accent|caret|shadow)-red-\d+\b/g,
    suggestion:
      'Use semantic tokens: bg-error, text-error, border-error, bg-error-subtle',
    severity: 'warn',
  },
  {
    name: 'Hardcoded color (orange)',
    pattern:
      /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|accent|caret|shadow)-orange-\d+\b/g,
    suggestion:
      'Use semantic tokens: bg-warning, text-warning, bg-warning-subtle',
    severity: 'warn',
  },
  {
    name: 'Hardcoded color (amber)',
    pattern:
      /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|accent|caret|shadow)-amber-\d+\b/g,
    suggestion:
      'Use semantic tokens: bg-warning, text-warning, bg-warning-subtle',
    severity: 'warn',
  },
  {
    name: 'Hardcoded color (yellow)',
    pattern:
      /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|accent|caret|shadow)-yellow-\d+\b/g,
    suggestion: 'Use semantic tokens: bg-warning, text-warning, fun-streak',
    severity: 'warn',
  },
  {
    name: 'Hardcoded color (lime)',
    pattern:
      /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|accent|caret|shadow)-lime-\d+\b/g,
    suggestion: 'Use semantic tokens: bg-success, text-success',
    severity: 'warn',
  },
  {
    name: 'Hardcoded color (green)',
    pattern:
      /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|accent|caret|shadow)-green-\d+\b/g,
    suggestion: 'Use semantic tokens: bg-success, text-success, border-success',
    severity: 'warn',
  },
  {
    name: 'Hardcoded color (emerald)',
    pattern:
      /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|accent|caret|shadow)-emerald-\d+\b/g,
    suggestion: 'Use semantic tokens: bg-success, text-success',
    severity: 'warn',
  },
  {
    name: 'Hardcoded color (teal)',
    pattern:
      /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|accent|caret|shadow)-teal-\d+\b/g,
    suggestion: 'Use semantic tokens: brand-accent, bg-info',
    severity: 'warn',
  },
  {
    name: 'Hardcoded color (cyan)',
    pattern:
      /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|accent|caret|shadow)-cyan-\d+\b/g,
    suggestion: 'Use semantic tokens: brand-accent, bg-info',
    severity: 'warn',
  },
  {
    name: 'Hardcoded color (sky)',
    pattern:
      /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|accent|caret|shadow)-sky-\d+\b/g,
    suggestion: 'Use semantic tokens: bg-info, text-info',
    severity: 'warn',
  },
  {
    name: 'Hardcoded color (blue)',
    pattern:
      /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|accent|caret|shadow)-blue-\d+\b/g,
    suggestion: 'Use semantic tokens: bg-info, text-link, brand-primary',
    severity: 'warn',
  },
  {
    name: 'Hardcoded color (indigo)',
    pattern:
      /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|accent|caret|shadow)-indigo-\d+\b/g,
    suggestion: 'Use semantic tokens: brand-primary, brand-secondary',
    severity: 'warn',
  },
  {
    name: 'Hardcoded color (violet)',
    pattern:
      /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|accent|caret|shadow)-violet-\d+\b/g,
    suggestion: 'Use semantic tokens: brand-accent, fun-party',
    severity: 'warn',
  },
  {
    name: 'Hardcoded color (purple)',
    pattern:
      /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|accent|caret|shadow)-purple-\d+\b/g,
    suggestion: 'Use semantic tokens: brand-accent, fun-party',
    severity: 'warn',
  },
  {
    name: 'Hardcoded color (fuchsia)',
    pattern:
      /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|accent|caret|shadow)-fuchsia-\d+\b/g,
    suggestion: 'Use semantic tokens: fun-party, fun-celebration',
    severity: 'warn',
  },
  {
    name: 'Hardcoded color (pink)',
    pattern:
      /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|accent|caret|shadow)-pink-\d+\b/g,
    suggestion: 'Use semantic tokens: fun-party, fun-celebration',
    severity: 'warn',
  },
  {
    name: 'Hardcoded color (rose)',
    pattern:
      /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|accent|caret|shadow)-rose-\d+\b/g,
    suggestion: 'Use semantic tokens: destructive, bg-error',
    severity: 'warn',
  },
  {
    name: 'Hardcoded gray color',
    pattern:
      /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|accent|caret|shadow)-(?:slate|gray|zinc|neutral|stone)-\d+\b/g,
    suggestion:
      'Use semantic tokens: muted, text-muted, text-secondary, bg-surface, bg-sunken',
    severity: 'warn',
  },
  // Default shadow classes
  {
    name: 'Default shadow',
    pattern: /\bshadow-(?:xs|sm|md|lg|xl|2xl|inner)\b/g,
    suggestion:
      'Use token shadows: shadow-raised, shadow-floating, shadow-overlay, shadow-popup',
    severity: 'warn',
  },
  {
    name: 'Bare shadow class',
    pattern: /(?<!transition-)\bshadow(?=\s|"|'|`|$)/g,
    suggestion:
      'Use token shadows: shadow-raised, shadow-floating, shadow-overlay',
    severity: 'warn',
  },
  // Default radius classes (keep sm, md, lg as they're mapped to tokens)
  {
    name: 'Non-token border radius',
    pattern: /\brounded-(?:xs|xl|2xl|3xl|4xl)\b/g,
    suggestion:
      'Use token radius: rounded-subtle, rounded-soft, rounded-button, rounded-card, rounded-modal',
    severity: 'warn',
  },
  // Numeric z-index (except 0)
  {
    name: 'Numeric z-index',
    pattern: /\bz-(?:10|20|30|40|50)\b/g,
    suggestion:
      'Use token z-index: z-lifted/z-float/z-top (local), z-sticky/z-dropdown/z-popover/z-modal/z-toast/z-tooltip (global)',
    severity: 'warn',
  },
  // Arbitrary values (potential escape hatch abuse)
  {
    name: 'Arbitrary color value',
    pattern: /\b(?:bg|text|border|ring|fill|stroke)-\[#[a-fA-F0-9]+\]/g,
    suggestion: 'Add color to design tokens instead of using arbitrary values',
    severity: 'warn',
  },
  {
    name: 'Arbitrary HSL/RGB value',
    pattern:
      /\b(?:bg|text|border|ring|fill|stroke)-\[(?:hsl|rgb|oklch)\([^\]]+\)\]/g,
    suggestion: 'Add color to design tokens instead of using arbitrary values',
    severity: 'warn',
  },
];

// =============================================================================
// TYPES
// =============================================================================

interface Violation {
  file: string;
  line: number;
  column: number;
  className: string;
  patternName: string;
  suggestion: string;
  severity: 'warn' | 'error';
  context: string;
}

// =============================================================================
// MAIN LOGIC
// =============================================================================

function extractClassNames(
  content: string
): Array<{ value: string; line: number; column: number }> {
  const results: Array<{ value: string; line: number; column: number }> = [];
  const lines = content.split('\n');

  // Match className="...", className={'...'}, className={`...`}, cn(...), clsx(...), cva(...)
  const patterns = [
    /className\s*=\s*["']([^"']+)["']/g,
    /className\s*=\s*\{["'`]([^"'`]+)["'`]\}/g,
    /className\s*=\s*\{`([^`]+)`\}/g,
    /\bcn\s*\(\s*["'`]([^"'`]+)["'`]/g,
    /\bclsx\s*\(\s*["'`]([^"'`]+)["'`]/g,
    /\bcva\s*\(\s*["'`]([^"'`]+)["'`]/g,
    /["']([^"']+)["']\s*,?\s*(?:\/\/|$)/g, // String literals that might be classes
  ];

  lines.forEach((lineContent, lineIndex) => {
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(lineContent)) !== null) {
        const classString = match[1];
        if (classString) {
          // Split by whitespace and filter
          const classes = classString.split(/\s+/).filter(Boolean);
          for (const cls of classes) {
            results.push({
              value: cls,
              line: lineIndex + 1,
              column: match.index + 1,
            });
          }
        }
      }
    }
  });

  return results;
}

function isExcepted(className: string, filePath: string): boolean {
  // Check global exceptions
  if (EXCEPTIONS['*']?.includes(className)) {
    return true;
  }

  // Check file-specific exceptions
  for (const [pattern, classes] of Object.entries(EXCEPTIONS)) {
    if (pattern === '*') continue;
    if (filePath.includes(pattern) && classes.includes(className)) {
      return true;
    }
  }

  return false;
}

function checkFile(filePath: string): Violation[] {
  const violations: Violation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const classes = extractClassNames(content);
  const lines = content.split('\n');

  for (const { value: className, line, column } of classes) {
    if (isExcepted(className, filePath)) {
      continue;
    }

    for (const pattern of VIOLATION_PATTERNS) {
      pattern.pattern.lastIndex = 0;
      if (pattern.pattern.test(className)) {
        violations.push({
          file: filePath,
          line,
          column,
          className,
          patternName: pattern.name,
          suggestion: pattern.suggestion,
          severity: pattern.severity,
          context: lines[line - 1]?.trim() || '',
        });
        break; // Only report first matching pattern per class
      }
    }
  }

  return violations;
}

async function main() {
  const webRoot = path.resolve(__dirname, '..');
  const args = process.argv.slice(2);
  const showSuggestions = args.includes('--fix-suggestions');

  console.log('🎨 Design Token Linter');
  console.log('='.repeat(60));
  console.log('');

  // Find all TSX/JSX files
  const files = await glob('**/*.{tsx,jsx}', {
    cwd: webRoot,
    ignore: IGNORE_PATTERNS,
    absolute: true,
  });

  console.log(`Scanning ${files.length} files...\n`);

  let totalViolations = 0;
  const violationsByFile: Map<string, Violation[]> = new Map();

  for (const file of files) {
    const violations = checkFile(file);
    if (violations.length > 0) {
      violationsByFile.set(file, violations);
      totalViolations += violations.length;
    }
  }

  // Report violations
  if (totalViolations === 0) {
    console.log('✅ No design token violations found!\n');
    console.log('All components are using proper design tokens.');
    process.exit(0);
  }

  // Group and display violations
  for (const [file, violations] of violationsByFile) {
    const relativePath = path.relative(webRoot, file);
    console.log(`\n📁 ${relativePath}`);
    console.log('-'.repeat(60));

    // Group by line
    const byLine = new Map<number, Violation[]>();
    for (const v of violations) {
      const existing = byLine.get(v.line) || [];
      existing.push(v);
      byLine.set(v.line, existing);
    }

    for (const [line, lineViolations] of byLine) {
      console.log(`  Line ${line}:`);
      for (const v of lineViolations) {
        const icon = v.severity === 'error' ? '❌' : '⚠️';
        console.log(`    ${icon} "${v.className}" - ${v.patternName}`);
        if (showSuggestions) {
          console.log(`       💡 ${v.suggestion}`);
        }
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   Files with violations: ${violationsByFile.size}`);
  console.log(`   Total violations: ${totalViolations}`);
  console.log('');

  // Show suggestion hint
  if (!showSuggestions) {
    console.log(
      '💡 Run with --fix-suggestions to see replacement suggestions\n'
    );
  }

  // Available tokens reference
  console.log('📖 Token Reference:');
  console.log(
    '   Colors: bg-primary, bg-secondary, bg-muted, bg-surface, bg-elevated'
  );
  console.log('           text-primary, text-secondary, text-muted, text-link');
  console.log(
    '           bg-success, bg-warning, bg-error, bg-info (+ -subtle variants)'
  );
  console.log(
    '   Shadows: shadow-raised, shadow-floating, shadow-overlay, shadow-popup'
  );
  console.log(
    '   Radius: rounded-subtle, rounded-soft, rounded-button, rounded-card'
  );
  console.log(
    '   Z-Index: z-sticky, z-dropdown, z-popover, z-modal, z-toast, z-tooltip'
  );
  console.log('');

  // Exit with warning (not error, since we're in warn mode)
  process.exit(0);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
