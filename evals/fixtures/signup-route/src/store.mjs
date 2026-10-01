export const accounts = new Map();
export function save(email) {
  if (accounts.has(email)) throw Object.assign(new Error('duplicate'), { code: 'DUPLICATE' });
  const account = { id: `u${accounts.size + 1}`, email };
  accounts.set(email, account);
  return account;
}
