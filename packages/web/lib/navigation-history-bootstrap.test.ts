import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadBindings, transform } from 'next/dist/build/swc';
import { trackNavigationHistory } from './navigation-history';

describe('Root-head navigation response', () => {
  it.each(['es2017', 'es2022'])(
    'executes the actual SWC-minified %s inline response without module closures and adopts it across module copies',
    async target => {
      const source = await readFile(
        resolve('lib/navigation-history.ts'),
        'utf8'
      );
      await loadBindings();
      const compiled = await transform(source, {
        filename: 'navigation-history.ts',
        jsc: {
          parser: { syntax: 'typescript' },
          target,
          minify: { compress: true, mangle: true },
        },
        module: { type: 'commonjs' },
        minify: true,
      });
      const response: Record<string, unknown> = {};
      new Function('exports', compiled.code)(response);
      if (typeof response.navigationHistoryBootstrapScript !== 'string')
        throw new Error('Expected an emitted inline response.');
      window.history.replaceState(null, '', '/docs/api');
      const length = window.history.length;
      const releaseHead = new Function(
        `return ${response.navigationHistoryBootstrapScript}`
      )() as () => void;
      const scope = window.history.state.__groupiNavigationScope;
      const releaseProvider = trackNavigationHistory();
      try {
        expect(window.location.pathname).toBe('/docs/api');
        expect(window.history.length).toBe(length);
        expect(window.history.state).not.toHaveProperty('__NA');
        expect(window.history.state).not.toHaveProperty(
          '__PRIVATE_NEXTJS_INTERNALS_TREE'
        );
        const nextState = {
          __NA: true,
          __PRIVATE_NEXTJS_INTERNALS_TREE: ['settings'],
          other: { preserved: true },
        };
        window.history.replaceState(nextState, '', '/settings');
        expect(window.history.state).toMatchObject(nextState);
        expect(window.history.state.__groupiNavigationScope).toBe(scope);
        releaseProvider();
        // The head owner survives provider cleanup; there is exactly one index
        // increment when app navigation creates the next entry.
        const position = window.history.state.__groupiNavigationIndex;
        window.history.pushState(nextState, '', '/settings/invite-lists');
        expect(window.history.state).toMatchObject(nextState);
        expect(window.history.state.__groupiNavigationScope).toBe(scope);
        expect(window.history.state.__groupiNavigationIndex).toBe(position + 1);
      } finally {
        releaseProvider();
        releaseHead();
      }
      // All leases released: an ordinary browser replacement remains untouched.
      const ordinaryState = { external: true };
      window.history.replaceState(ordinaryState, '', '/after-document');
      expect(window.history.state).toEqual(ordinaryState);
      // A reloaded document inherits the entry's browser state, but has no
      // singleton. Its head must not claim continuity with the old document.
      const restoredState = {
        __groupiNavigationScope: scope,
        __groupiNavigationIndex: 7,
        __NA: true,
        __PRIVATE_NEXTJS_INTERNALS_TREE: ['settings'],
      };
      window.history.replaceState(restoredState, '', '/settings');
      const restoredLength = window.history.length;
      const releaseReloadedHead = new Function(
        `return ${response.navigationHistoryBootstrapScript}`
      )() as () => void;
      const releaseReloadedProvider = trackNavigationHistory();
      try {
        expect(window.history.state.__groupiNavigationScope).not.toBe(scope);
        expect(window.history.state.__groupiNavigationIndex).toBe(0);
        expect(window.history.state.__PRIVATE_NEXTJS_INTERNALS_TREE).toEqual([
          'settings',
        ]);
        expect(window.history.state.__NA).toBe(true);
        expect(window.location.pathname).toBe('/settings');
        expect(window.history.length).toBe(restoredLength);
      } finally {
        releaseReloadedProvider();
        releaseReloadedHead();
      }
    }
  );
});
