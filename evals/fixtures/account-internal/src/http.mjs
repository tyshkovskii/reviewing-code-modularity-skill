import { getAccount } from './service.mjs';
export function accountResponse(id) {
  const account = getAccount(id);
  return account ? { status: 200, body: account } : { status: 404, body: { error: 'not_found' } };
}
