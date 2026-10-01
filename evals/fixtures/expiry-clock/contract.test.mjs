import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const projectRoot = process.env.MODULARITY_FIXTURE_ROOT || dirname(fileURLToPath(import.meta.url));
const load = (path) => import(pathToFileURL(resolve(projectRoot, path)).href);

const { isExpired } = await load('src/expiry.mjs');
test('exact boundary currently needs a global clock patch', () => {
  const original = Date.now;
  try {
    Date.now = () => 1000;
    assert.equal(isExpired({ expiresAt: 1001 }), false);
    assert.equal(isExpired({ expiresAt: 1000 }), true);
  } finally { Date.now = original; }
});
