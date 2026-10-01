import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const projectRoot = process.env.MODULARITY_FIXTURE_ROOT || dirname(fileURLToPath(import.meta.url));
const load = (path) => import(pathToFileURL(resolve(projectRoot, path)).href);

const { submitHttp } = await load('src/http.mjs');
const { submitCli } = await load('src/cli.mjs');
const entrypoints = [submitHttp, submitCli];
const input = { customer: 'Ada', items: [{ cents: 100 }, { cents: 250 }] };
function effects({ saveError, sendError } = {}) {
  const calls = [];
  return { calls, io: {
    save(order) { calls.push(['save', order]); if (saveError) throw saveError; return { id: 'o1' }; },
    sendReceipt(id, cents) { calls.push(['send', id, cents]); if (sendError) throw sendError; }
  } };
}
test('outputs and effect ordering', () => {
  for (const submit of entrypoints) {
    const { calls, io } = effects();
    const result = submit(structuredClone(input), io);
    assert.deepEqual(result, submit === submitHttp ? { status: 201, body: { id: 'o1', totalCents: 350 } } : 'Created o1: 350');
    assert.deepEqual(calls, [['save', { customer: 'Ada', totalCents: 350 }], ['send', 'o1', 350]]);
  }
});
test('invalid input has no effects and preserves errors', () => {
  for (const submit of entrypoints) for (const [items, message] of [[[], 'empty_order'], [null, 'empty_order'], [undefined, 'empty_order'], [{}, 'empty_order'], ['items', 'empty_order'], [[{ cents: -1 }], 'invalid_price'], [[{ cents: 1.5 }], 'invalid_price']]) {
    const { calls, io } = effects();
    assert.throws(() => submit({ customer: 'Ada', items }, io), { name: 'Error', message });
    assert.deepEqual(calls, []);
  }
});
test('save failure propagates unchanged and prevents send', () => {
  for (const submit of entrypoints) {
    const error = new Error('database_offline');
    const { calls, io } = effects({ saveError: error });
    assert.throws(() => submit(input, io), (actual) => actual === error);
    assert.equal(calls.length, 1);
  }
});
test('receipt failure propagates after save without compensation', () => {
  for (const submit of entrypoints) {
    const error = new Error('mail_offline');
    const { calls, io } = effects({ sendError: error });
    assert.throws(() => submit(input, io), (actual) => actual === error);
    assert.deepEqual(calls, [['save', { customer: 'Ada', totalCents: 350 }], ['send', 'o1', 350]]);
  }
});
test('entrypoints do not mutate input', () => {
  for (const submit of entrypoints) {
    const copy = structuredClone(input);
    submit(copy, effects().io);
    assert.deepEqual(copy, input);
  }
});
