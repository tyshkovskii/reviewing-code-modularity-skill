import { save } from './store.mjs';
import { sendWelcome } from './mail.mjs';
export function signupRoute(request) {
  let body;
  try { body = JSON.parse(request.body); }
  catch { return { status: 400, body: { error: 'invalid_json' } }; }
  if (typeof body?.email !== 'string' || !body.email.includes('@')) {
    return { status: 422, body: { error: 'invalid_email' } };
  }
  const email = body.email.trim().toLowerCase();
  try {
    const account = save(email);
    sendWelcome(email);
    return { status: 201, body: account };
  } catch (error) {
    if (error.code === 'DUPLICATE') return { status: 409, body: { error: 'email_exists' } };
    throw error;
  }
}
