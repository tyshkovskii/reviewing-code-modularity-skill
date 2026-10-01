import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const projectRoot = process.env.MODULARITY_FIXTURE_ROOT || dirname(fileURLToPath(import.meta.url));
const load = (path) => import(pathToFileURL(resolve(projectRoot, path)).href);

const { parseRecord } = await load('src/parse-record.mjs');
test('quoted record behavior', () => {
  assert.deepEqual(parseRecord('a,"b,c","d""e"'), ['a', 'b,c', 'd"e']);
  assert.deepEqual(parseRecord(''), ['']);
  assert.throws(() => parseRecord('"abc'), { name: 'SyntaxError', message: 'unclosed quote' });
  assert.throws(() => parseRecord('"a"b'), /unexpected quote content/);
});
