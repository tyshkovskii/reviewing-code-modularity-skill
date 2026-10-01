import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const projectRoot = process.env.MODULARITY_FIXTURE_ROOT || dirname(fileURLToPath(import.meta.url));
const load = (path) => import(pathToFileURL(resolve(projectRoot, path)).href);

const { checkoutTotal } = await load('src/checkout.mjs');
const { renewalTotal } = await load('src/renewal.mjs');
test('both channels honor the current policy at the boundary', () => {
  for (const quote of [checkoutTotal, renewalTotal]) {
    assert.deepEqual(quote(4999), { subtotalCents: 4999, deliveryCents: 500, totalCents: 5499 });
    assert.deepEqual(quote(5000), { subtotalCents: 5000, deliveryCents: 0, totalCents: 5000 });
  }
});
