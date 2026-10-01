import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const projectRoot = process.env.MODULARITY_FIXTURE_ROOT || dirname(fileURLToPath(import.meta.url));
const load = (path) => import(pathToFileURL(resolve(projectRoot, path)).href);

const api = await load('src/index.mjs');
const { greeting } = await load('consumer.mjs');
test('public compatibility', () => {
  assert.deepEqual(Object.keys(api), ['getAccount']);
  assert.equal(api.getAccount('missing'), null);
  assert.equal(greeting('u1'), 'Hello, Ada');
});
