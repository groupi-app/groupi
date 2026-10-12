import { describe, expect, it } from 'vitest';
import { Linter } from 'eslint';
import path from 'node:path';
import featureImports from './feature-imports.mjs';

function messages(code: string, filename = 'app/page.js') {
  return new Linter().verify(
    code,
    {
      plugins: { groupi: { rules: { 'feature-imports': featureImports } } },
      rules: { 'groupi/feature-imports': 'error' },
    },
    { filename: path.resolve(filename) }
  );
}

describe('feature import enforcement', () => {
  it.each([
    "import { getAddonById } from '@/features/addons/runtime';",
    "export { BuilderPage } from '@/features/addons/authoring';",
    "import { useAddonGating } from '../features/addons/gating.ts';",
  ])('allows a route to consume a public entry: %s', code => {
    expect(messages(code)).toEqual([]);
  });

  it.each([
    "import '@/features/addons/model/types';",
    "export * from '../features/addons/model/custom-addon-schema';",
    "import('@/features/addons/runtime/addon-page');",
    "require('@/features/addons/authoring/builder-page');",
    "import '~/features/addons/authoring/builder-page';",
  ])('rejects private imports regardless of import syntax: %s', code => {
    expect(messages(code).map(message => message.messageId)).toEqual([
      'privateImport',
    ]);
  });

  it('allows implementation-local dependencies', () => {
    expect(
      messages("import '../model/types';", 'features/addons/runtime/example.js')
    ).toEqual([]);
  });

  it('rejects feature dependencies on route implementation', () => {
    expect(
      messages(
        "import '../../../app/page';",
        'features/addons/model/types.js'
      ).map(message => message.messageId)
    ).toEqual(['routeImport']);
  });

  it.each(['../authoring/builder-page', '../creation', '../creation/catalog'])(
    'keeps runtime consumers independent of %s',
    specifier => {
      expect(
        messages(
          `import '${specifier}';`,
          'features/addons/runtime/catalog.js'
        ).map(message => message.messageId)
      ).toEqual(['authoringImport']);
    }
  );
});
