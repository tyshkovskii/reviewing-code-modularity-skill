import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const projectRoot = process.env.MODULARITY_FIXTURE_ROOT || dirname(fileURLToPath(import.meta.url));
const load = (path) => import(pathToFileURL(resolve(projectRoot, path)).href);

const { formatCents } = await load('src/amount.mjs');
const { exportRow } = await load('src/export-row.mjs');
test('pure amount behavior', () => {
  assert.equal(formatCents(0), '0.00');
  assert.equal(formatCents(125), '1.25');
  assert.equal(exportRow({ id: 'i1', totalCents: 1200 }), 'i1,12.00');
});
