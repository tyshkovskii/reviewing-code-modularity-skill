import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const projectRoot = process.env.MODULARITY_FIXTURE_ROOT || dirname(fileURLToPath(import.meta.url));
const load = (path) => import(pathToFileURL(resolve(projectRoot, path)).href);

const { accountResponse } = await load('src/http.mjs');
test('account responses', () => {
  assert.deepEqual(accountResponse('u1'), { status: 200, body: { id: 'u1', name: 'Ada' } });
  assert.deepEqual(accountResponse('missing'), { status: 404, body: { error: 'not_found' } });
});
