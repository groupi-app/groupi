import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** Audit our own packed files, excluding installed third-party dependencies.
 * The allowlist is deliberately narrower than package.json's directory globs.
 * This catches accidental private files; it is not an exhaustive secret scanner.
 * @param {string} root
 */
export async function auditPackage(root) {
  /** @type {string[]} */
  const files = [];
  /** @param {string} relative */
  async function visit(relative) {
    for (const entry of await readdir(join(root, relative), {
      withFileTypes: true,
    })) {
      if (!relative && entry.name === 'node_modules') continue;
      const name = relative ? `${relative}/${entry.name}` : entry.name;
      assert(!entry.isSymbolicLink(), `Unexpected package symlink: ${name}`);
      if (entry.isDirectory()) await visit(name);
      else {
        assert(entry.isFile(), `Unexpected package entry: ${name}`);
        assert(
          !/(?:^|\/)(?:credentials?|secrets?|tokens?|profiles?|config)\.(?:json|ya?ml|toml|env|ini|pem)$/i.test(
            name
          ) &&
            /^(?:package\.json|(?:README|CHANGELOG)\.md|LICENSE|bin\/groupi\.js|src\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.js|docs\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.(?:md|json)|skills\/(?:[a-z0-9-]+\/)*SKILL\.md|scripts\/generate-reference\.js)$/.test(
              name
            ),
          `Unapproved packed file: ${name}`
        );
        const content = await readFile(join(root, name), 'utf8');
        assert(
          !/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:npm_[a-zA-Z0-9]{36}|ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{50,})\b/.test(
            content
          ),
          `Potential credential in packed file: ${name}`
        );
        files.push(name);
      }
    }
  }
  await visit('');
  for (const required of [
    'package.json',
    'README.md',
    'LICENSE',
    'bin/groupi.js',
    'src/command.js',
    'src/credential-store.js',
    'docs/command-reference.json',
    'docs/command-reference.md',
    'docs/agent-workflows.json',
    'skills/groupi/SKILL.md',
    'scripts/generate-reference.js',
  ]) {
    assert(
      files.includes(required),
      `Missing runtime/guidance file: ${required}`
    );
  }
  return files.sort();
}
