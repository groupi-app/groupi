/* global fetch */
import process from 'node:process';
import { URL } from 'node:url';
import { setTimeout } from 'node:timers';
// Executes the HTML served by the actual local example, not a copied renderer.
// jsdom checks DOM behavior, not physical browser/device accessibility.
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
const [url, expected] = process.argv.slice(2);
const html = await (await fetch(url)).text();
const dom = new JSDOM(html, {
  url,
  runScripts: 'dangerously',
  beforeParse(window) {
    window.fetch = (path, options) => fetch(new URL(path, url), options);
  },
});
const document = dom.window.document;
assert.equal(document.getElementById('status').textContent, 'Loading…');
async function finished() {
  const deadline = Date.now() + 10000;
  while (document.getElementById('refresh').disabled && Date.now() < deadline)
    await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(document.getElementById('refresh').disabled, false);
}
await finished();
assert.match(
  document.getElementById('status').textContent,
  new RegExp(expected)
);
if (expected === 'Loaded') {
  assert.equal(
    document.getElementById('title').textContent,
    "Theia's café <test>"
  );
  assert.equal(document.querySelector('test'), null);
  assert.equal(document.getElementById('date').textContent, 'Date not set');
}
document.getElementById('refresh').click();
assert.equal(document.getElementById('status').textContent, 'Loading…');
await finished();
assert.match(
  document.getElementById('status').textContent,
  new RegExp(expected)
);
dom.window.close();
