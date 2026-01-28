/**
 * Prettier configuration for Groupi
 * Ensures consistent formatting across web, mobile, and shared packages
 */

module.exports = {
  // Core formatting
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,

  // JSX specific
  jsxSingleQuote: true,
  jsxBracketSameLine: false,

  // Other
  arrowParens: 'avoid',
  endOfLine: 'lf',
  bracketSpacing: true,
  quoteProps: 'as-needed',

  // File type overrides
  overrides: [
    // Markdown files - preserve line breaks
    {
      files: '*.md',
      options: {
        printWidth: 100,
        proseWrap: 'preserve',
      },
    },
    // JSON files - consistent indentation
    {
      files: '*.json',
      options: {
        printWidth: 100,
      },
    },
    // YAML files
    {
      files: '*.{yml,yaml}',
      options: {
        singleQuote: false,
      },
    },
    // React Native - slightly different for mobile
    {
      files: 'packages/mobile/**/*.{ts,tsx,js,jsx}',
      options: {
        printWidth: 90, // Slightly longer for mobile screens
        semi: true,
      },
    },
  ],
};
