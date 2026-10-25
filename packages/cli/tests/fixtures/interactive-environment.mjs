import './keyring-environment.mjs';
import process from 'node:process';
for (const stream of [process.stdin, process.stdout, process.stderr]) {
  Object.defineProperty(stream, 'isTTY', { value: true });
}
