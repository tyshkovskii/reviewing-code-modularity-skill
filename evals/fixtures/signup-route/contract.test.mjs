import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const projectRoot = process.env.MODULARITY_FIXTURE_ROOT || dirname(fileURLToPath(import.meta.url));
const load = (path) => import(pathToFileURL(resolve(projectRoot, path)).href);

const { signupRoute } = await load('src/signup-route.mjs');
const { accounts } = await load('src/store.mjs');
const { sent } = await load('src/mail.mjs');
test('existing signup transport contract', () => {
  accounts.clear(); sent.length = 0;
  assert.deepEqual(signupRoute({ body: '{' }), { status: 400, body: { error: 'invalid_json' } });
  assert.deepEqual(signupRoute({ body: '{}' }), { status: 422, body: { error: 'invalid_email' } });
  assert.deepEqual(signupRoute({ body: '{"email":" ADA@example.com "}' }), { status: 201, body: { id: 'u1', email: 'ada@example.com' } });
  assert.deepEqual(signupRoute({ body: '{"email":"ada@example.com"}' }), { status: 409, body: { error: 'email_exists' } });
  assert.deepEqual(sent, ['ada@example.com']);
});
