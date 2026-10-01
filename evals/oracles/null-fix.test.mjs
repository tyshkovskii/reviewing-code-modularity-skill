import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
if (!process.env.MODULARITY_FIXTURE_ROOT) throw new Error('Set MODULARITY_FIXTURE_ROOT to the run project');
const { profileResponse } = await import(pathToFileURL(resolve(process.env.MODULARITY_FIXTURE_ROOT, 'src/profile.mjs')).href);
test('null profile returns the requested guest response', () => {
  assert.deepEqual(profileResponse({ profile: null }), { status: 200, body: { displayName: 'Guest' } });
});
test('normal profile remains unchanged', () => {
  assert.deepEqual(profileResponse({ profile: { name: 'Ada' } }), { status: 200, body: { displayName: 'Ada' } });
});
