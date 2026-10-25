import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const featureRoot = path.join(webRoot, 'features/addons');
const publicEntries = new Set([
  'runtime',
  'creation',
  'authoring',
  'hooks',
  'schema',
  'fields',
  'gating',
  'completion',
  'page',
]);

function within(root, filename) {
  return filename === root || filename.startsWith(`${root}${path.sep}`);
}

function resolveImport(filename, specifier) {
  if (specifier.startsWith('@/') || specifier.startsWith('~/')) {
    return path.resolve(webRoot, specifier.slice(2));
  }
  if (specifier.startsWith('.')) {
    return path.resolve(path.dirname(filename), specifier);
  }
  return path.isAbsolute(specifier) ? path.normalize(specifier) : null;
}

/** @type {import('eslint').Rule.RuleModule} */
const featureImports = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      privateImport:
        'Import add-ons through a public feature entry point, not its private implementation.',
      routeImport:
        'Add-on implementations must not depend on route-owned code.',
      authoringImport:
        'Runtime and shared add-on code must not import authoring or creation implementations.',
    },
  },
  create(context) {
    const filename = context.filename;
    const inside = within(featureRoot, filename);
    const relative = path
      .relative(featureRoot, filename)
      .replaceAll(path.sep, '/');
    const editing = /^(authoring|creation)([/.]|$)/.test(relative);

    function check(node) {
      if (!node || typeof node.value !== 'string') return;
      const target = resolveImport(filename, node.value);
      if (!target) return;

      if (inside && within(path.join(webRoot, 'app'), target)) {
        context.report({ node, messageId: 'routeImport' });
        return;
      }
      if (!within(featureRoot, target)) return;

      const imported = path
        .relative(featureRoot, target)
        .replaceAll(path.sep, '/')
        .replace(/\.(?:[cm]?[jt]sx?)$/, '');
      if (!inside && !publicEntries.has(imported)) {
        context.report({ node, messageId: 'privateImport' });
      } else if (
        inside &&
        !editing &&
        /^(authoring|creation)([/.]|$)/.test(imported)
      ) {
        context.report({ node, messageId: 'authoringImport' });
      }
    }

    return {
      ImportDeclaration: node => check(node.source),
      ExportNamedDeclaration: node => check(node.source),
      ExportAllDeclaration: node => check(node.source),
      ImportExpression: node => check(node.source),
      CallExpression: node => {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require'
        ) {
          check(node.arguments[0]);
        }
      },
    };
  },
};

export default featureImports;
