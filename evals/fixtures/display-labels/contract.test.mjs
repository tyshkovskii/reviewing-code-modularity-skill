import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const projectRoot = process.env.MODULARITY_FIXTURE_ROOT || dirname(fileURLToPath(import.meta.url));
const load = (path) => import(pathToFileURL(resolve(projectRoot, path)).href);

const { accountLabel } = await load('src/account.mjs');
const { invoiceLabel } = await load('src/invoice.mjs');
test('current label outputs', () => {
  assert.equal(accountLabel(' Ada '), 'ADA');
  assert.equal(invoiceLabel(' inv-21 '), 'INV-21');
});
