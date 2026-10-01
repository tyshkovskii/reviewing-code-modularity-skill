import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const projectRoot = process.env.MODULARITY_FIXTURE_ROOT || dirname(fileURLToPath(import.meta.url));
const load = (path) => import(pathToFileURL(resolve(projectRoot, path)).href);

const { profileResponse } = await load('src/profile.mjs');
test('normal profile', () => {
  assert.deepEqual(profileResponse({ profile: { name: 'Ada' } }), { status: 200, body: { displayName: 'Ada' } });
});
test('known baseline defect is reproduced, not accepted as desired behavior', () => {
  assert.throws(() => profileResponse({ profile: null }), TypeError);
});
