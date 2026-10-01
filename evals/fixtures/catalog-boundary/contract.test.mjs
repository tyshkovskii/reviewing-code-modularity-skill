import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const projectRoot = process.env.MODULARITY_FIXTURE_ROOT || dirname(fileURLToPath(import.meta.url));
const load = (path) => import(pathToFileURL(resolve(projectRoot, path)).href);

const { reportTitles } = await load('src/report.mjs');
const { exportTitles } = await load('src/export.mjs');
test('both integrations currently return the same titles', () => {
  assert.deepEqual(reportTitles(), ['Trail mug']);
  assert.deepEqual(exportTitles(), ['Trail mug']);
});
