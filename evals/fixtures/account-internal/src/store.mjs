const accounts = new Map([['u1', { id: 'u1', name: 'Ada' }]]);
export function findAccount(id) { return accounts.get(id) ?? null; }
