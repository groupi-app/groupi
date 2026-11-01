import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  localExamples,
  widgetExamples,
  groupExamples,
  updateExamples,
  delegatedReadExamples,
} from '../src/learning-examples';

const directory = mkdtempSync(join(tmpdir(), 'groupi-example-contract-'));
try {
  for (const [language, extension] of [
    ['typescript', 'mts'],
    ['python', 'py'],
    ['curl', 'sh'],
  ] as const) {
    writeFileSync(
      join(directory, `first-event.${extension}`),
      localExamples[language]
    );
    writeFileSync(
      join(directory, `widget.${extension}`),
      widgetExamples[language]
    );
    writeFileSync(
      join(directory, `groups.${extension}`),
      groupExamples[language]
    );
    writeFileSync(
      join(directory, `update.${extension}`),
      updateExamples[language]
    );
    writeFileSync(
      join(directory, `delegated.${extension}`),
      delegatedReadExamples[language]
    );
  }
  execFileSync(
    'openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-keyout',
      join(directory, 'fixture-key.pem'),
      '-out',
      join(directory, 'fixture-cert.pem'),
      '-days',
      '1',
      '-subj',
      '/CN=localhost',
      '-addext',
      'subjectAltName=IP:127.0.0.1,DNS:localhost',
    ],
    { stdio: 'pipe' }
  );
  execFileSync(
    'python3',
    [join(import.meta.dirname, 'verify-local-examples.py'), directory],
    { stdio: 'inherit' }
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
