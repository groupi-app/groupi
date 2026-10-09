import { afterEach, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const changesetsRequire = createRequire(
  require.resolve('@changesets/cli/package.json')
);
const getReleasePlan = changesetsRequire(
  '@changesets/get-release-plan'
).default;
const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories.splice(0).map(dir => rm(dir, { recursive: true }))
  );
});

it.each(['@groupi/cli', '@groupi/shared'])(
  'keeps release planning independent when %s changes',
  async name => {
    const directory = await mkdtemp(join(tmpdir(), 'groupi-version-'));
    directories.push(directory);
    await mkdir(join(directory, '.changeset'));
    await writeFile(
      join(directory, 'package.json'),
      JSON.stringify({ name: 'release-fixture', private: true })
    );
    await writeFile(
      join(directory, 'pnpm-workspace.yaml'),
      'packages:\n  - packages/*\n'
    );
    await writeFile(
      join(directory, '.changeset/config.json'),
      await readFile(
        new URL('../../../.changeset/config.json', import.meta.url)
      )
    );
    for (const pkg of ['cli', 'shared', 'web', 'mobile', 'convex']) {
      const path = join(directory, 'packages', pkg);
      await mkdir(path, { recursive: true });
      await writeFile(
        join(path, 'package.json'),
        JSON.stringify({
          name: `@groupi/${pkg}`,
          version: pkg === 'cli' ? '0.1.0' : '2.0.0',
        })
      );
    }
    await writeFile(
      join(directory, '.changeset/release.md'),
      `---\n'${name}': minor\n---\n\nRelease fixture\n`
    );
    if (name !== '@groupi/cli') {
      await writeFile(
        join(directory, '.changeset/web-patch.md'),
        "---\n'@groupi/web': patch\n---\n\nLinked app fixture\n"
      );
    }
    const plan = await getReleasePlan(directory);
    const cli = plan.releases.find(
      (release: { name: string }) => release.name === '@groupi/cli'
    );
    if (name === '@groupi/cli') {
      expect(plan.releases).toHaveLength(1);
      expect(cli.newVersion).toBe('0.2.0');
    } else {
      expect(cli).toBeUndefined();
      expect(
        plan.releases.find(
          (release: { name: string }) => release.name === '@groupi/web'
        ).newVersion
      ).toBe('2.1.0');
      expect(
        plan.releases.find(
          (release: { name: string }) => release.name === '@groupi/shared'
        ).newVersion
      ).toBe('2.1.0');
    }
  }
);
