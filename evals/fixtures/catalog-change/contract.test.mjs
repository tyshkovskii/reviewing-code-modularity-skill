import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const projectRoot = process.env.MODULARITY_FIXTURE_ROOT || dirname(fileURLToPath(import.meta.url));
const load = (path) => import(pathToFileURL(resolve(projectRoot, path)).href);

const before = await load('base/admin.mjs');
const after = await load('head/admin.mjs');
const added = await load('head/export.mjs');
test('snapshot behavior is executable', () => {
  assert.deepEqual(before.adminTitles(), ['Mug']);
  assert.deepEqual(after.adminTitles(), ['Mug']);
  assert.deepEqual(added.exportTitles(), ['Mug']);
});
